/**
 * sync/syncEngine.ts — delta sync between local IndexedDB and Supabase.
 *
 * Design rules (from docs/ARCHITECTURE.md):
 *  - UI NEVER awaits the network. Local IndexedDB is the source of truth for rendering.
 *  - Writes are queued in the local outbox, flushed in batches of 50.
 *  - Conflict resolution: LWW by updated_at for items/content, append-only for events.
 *  - apply_ops is idempotent (client-supplied event ids, ON CONFLICT DO NOTHING).
 *  - Retry with exponential backoff; the queue survives reloads.
 */

import { getSupabase, isSupabaseConfigured } from './supabase';
import { getPendingOps, removeOp, incrementRetry } from '../storage/syncQueue';

const BATCH_SIZE = 50;
const IDLE_FLUSH_MS = 5000;
const PERIODIC_FLUSH_MS = 30000;
const BACKOFF_MS = [2000, 4000, 8000, 30000];

export interface SyncOp {
  target: 'item' | 'event' | 'content';
  [key: string]: any;
}

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error' | 'unauthenticated';

let flushing = false;
let backoffIndex = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let periodicTimer: ReturnType<typeof setInterval> | null = null;
let started = false;

const listeners = new Set<(state: SyncState) => void>();
let currentState: SyncState = 'idle';

export function getSyncState(): SyncState {
  return currentState;
}

export function onSyncStateChange(fn: (state: SyncState) => void): () => void {
  listeners.add(fn);
  fn(currentState);
  return () => listeners.delete(fn);
}

function setState(s: SyncState) {
  if (currentState === s) return;
  currentState = s;
  listeners.forEach((fn) => fn(s));
}

/** Map an outbox entry to wire ops for apply_ops. One entry may fan out. */
function toWireOps(entry: { store: string; op: 'put' | 'delete'; payload: any }): SyncOp[] {
  const p = entry.payload ?? {};

  switch (entry.store) {
    case 'statistics': {
      // Study events are queued under the statistics store with an `id` and
      // `ts`; they map to the append-only study_events table.
      if (p.id && p.ts && p.kind) {
        return [{
          target: 'event',
          id: p.id,
          ts: p.ts,
          kind: p.kind,
          level: p.level ?? undefined,
          correct: p.correct ?? undefined,
          duration_ms: p.duration_ms ?? undefined,
          meta: p.meta ?? undefined,
        }];
      }
      // The statistics blob itself.
      return [{
        target: 'content',
        kind: 'statistics',
        payload: p.payload ?? p,
        updated_at: new Date(p.updated_at ?? Date.now()).toISOString(),
      }];
    }

    case 'custom_vocab':
    case 'vocab_overrides':
    case 'custom_sentences':
      return [{
        target: 'content',
        kind: entry.store,
        payload: p.payload ?? p,
        updated_at: new Date(p.updated_at ?? Date.now()).toISOString(),
      }];

    case 'srs_state': {
      // SRS scheduling mirrors into learning_items (srs_box / srs_due_at).
      const state = p.payload ?? p;
      const out: SyncOp[] = [];
      Object.values<any>(state).forEach((item) => {
        if (!item || !item.kind || !item.refId) return;
        out.push({
          target: 'item',
          kind: item.kind,
          ref_id: item.refId,
          status: item.box >= 5 ? 'mastered' : item.box === 0 ? 'learning_new' : 'review',
          srs_box: item.box ?? 0,
          srs_due_at: item.dueAt ? new Date(item.dueAt).toISOString() : null,
          wrong_count: item.lapses ?? 0,
          deleted: false,
          updated_at: new Date(item.lastReviewed ?? Date.now()).toISOString(),
        });
      });
      return out;
    }

    case 'learned_vocab':
    case 'learned_sentences': {
      const chinese = p.chinese ?? p.payload?.chinese;
      if (!chinese) return [];
      const item = p.payload ?? p;
      return [{
        target: 'item',
        kind: entry.store === 'learned_vocab' ? 'vocab' : 'sentence',
        ref_id: chinese,
        status: item.passedTests?.pinyin && item.passedTests?.writing && item.passedTests?.meaning
          ? 'mastered'
          : 'learning',
        srs_box: 0,
        wrong_count: 0,
        deleted: false,
        updated_at: new Date(item.lastPracticed ?? p.updated_at ?? Date.now()).toISOString(),
      }];
    }

    case 'wrong_vocab':
    case 'wrong_sentences': {
      const item = p.payload ?? p;
      const chinese = item.vocabulary?.chinese ?? item.sentence?.chinese;
      if (!chinese) return [];
      return [{
        target: 'item',
        kind: entry.store === 'wrong_vocab' ? 'vocab' : 'sentence',
        ref_id: chinese,
        status: 'learning',
        srs_box: 0,
        wrong_count: item.wrongCount ?? 0,
        deleted: false,
        updated_at: new Date(item.lastWrong ?? p.updated_at ?? Date.now()).toISOString(),
      }];
    }

    default:
      return [];
  }
}

/**
 * Flush pending outbox ops to the server.
 * Safe to call often — it no-ops when there is nothing pending or no session.
 */
export async function flush(): Promise<void> {
  if (flushing) return;
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) {
    setState('unauthenticated');
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    setState('unauthenticated');
    return;
  }

  const pending = await getPendingOps();
  if (pending.length === 0) {
    setState('idle');
    return;
  }

  flushing = true;
  setState('syncing');
  let batch: Awaited<ReturnType<typeof getPendingOps>> = [];

  try {
    batch = pending.slice(0, BATCH_SIZE);
    const ops = batch.flatMap(toWireOps);

    if (ops.length === 0) {
      // Nothing mappable — drop them so the queue cannot stall forever.
      await Promise.all(batch.map((b) => removeOp(b.id)));
      flushing = false;
      setState('idle');
      return;
    }

    const { error } = await supabase.rpc('apply_ops', { p_ops: ops });

    if (error) throw new Error(error.message);

    // Success — remove only the entries we actually sent.
    const sentIds = new Set(batch.map((b) => b.id));
    await Promise.all(batch.filter((b) => sentIds.has(b.id)).map((b) => removeOp(b.id)));

    backoffIndex = 0;
    setState('idle');

    // More to send — continue immediately.
    if ((await getPendingOps()).length > 0) {
      void flush();
    }
  } catch (e) {
    console.warn('[sync] flush failed:', e);
    setState(navigator.onLine ? 'error' : 'offline');
    // Back off, but keep the queue intact.
    const delay = BACKOFF_MS[Math.min(backoffIndex, BACKOFF_MS.length - 1)];
    backoffIndex++;
    await Promise.all(batch.map((b) => incrementRetry(b.id)));
    setTimeout(() => void flush(), delay);
  } finally {
    flushing = false;
  }
}

/** Request a flush soon (debounced) — call after any local write. */
export function scheduleFlush(): void {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => void flush(), IDLE_FLUSH_MS);
}

/** Pull remote changes newer than the given cursor into local storage. */
export async function pull(sinceIso?: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return;
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return;

  const { data, error } = await supabase
    .from('learning_items')
    .select('*')
    .gt('updated_at', sinceIso ?? '1970-01-01T00:00:00Z');

  if (error) {
    console.warn('[sync] pull failed:', error.message);
    return;
  }
  if (!data || data.length === 0) return;

  const { applyRemoteItems } = await import('./applyRemote');
  await applyRemoteItems(data);
}

/** Start the sync engine: listeners + timers. */
export function startSyncEngine(): void {
  if (started) return;
  started = true;

  window.addEventListener('online', () => {
    setState('idle');
    void flush();
  });
  window.addEventListener('offline', () => setState('offline'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void flush();
  });

  periodicTimer = setInterval(() => void flush(), PERIODIC_FLUSH_MS);
  void flush();
}

export function stopSyncEngine(): void {
  if (!started) return;
  started = false;
  if (idleTimer) clearTimeout(idleTimer);
  if (periodicTimer) clearInterval(periodicTimer);
}
