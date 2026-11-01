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

/**
 * One INSERT … ON CONFLICT statement may not touch the same row twice.
 * A batch can carry two writes for one item or one content blob (a retry, or
 * two answers in the same flush). Keep the newest and drop the rest.
 */
function dedupeOps(ops: SyncOp[]): SyncOp[] {
  const rank = new Map<string, { op: SyncOp; ts: number; index: number }>();
  const passthrough: SyncOp[] = [];
  ops.forEach((op, index) => {
    const ts = Date.parse(op.updated_at ?? '') || 0;
    let key: string | null = null;
    if (op.target === 'content' && op.kind) key = `content:${op.kind}`;
    else if (op.target === 'item' && op.kind && op.ref_id) key = `item:${op.kind}:${op.ref_id}`;
    if (key === null) {
      passthrough.push(op);
      return;
    }
    const prev = rank.get(key);
    if (!prev || ts >= prev.ts) rank.set(key, { op, ts, index });
  });
  return [...passthrough, ...[...rank.values()].sort((a, b) => a.index - b.index).map((v) => v.op)];
}

/** Map an outbox entry to wire ops for apply_ops. One entry may fan out. */
function toWireOps(entry: { store: string; op: 'put' | 'delete'; payload: any }): SyncOp[] {
  const p = entry.payload ?? {};

  switch (entry.store) {
    case 'statistics': {
      // Study events are queued under the statistics store with an `id` and
      // `ts`. Their wire kind must differ from the statistics blob's kind,
      // or one apply_ops call updates the same (user_id, kind) row twice and
      // Postgres rejects the whole batch.
      if (p.id && p.ts && p.kind) {
        return [{
          target: 'event',
          id: p.id,
          ts: p.ts,
          kind: `event_${p.kind}`,
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
    case 'learned_vocab':
    case 'learned_sentences':
    case 'wrong_vocab':
    case 'wrong_sentences':
      return [{
        target: 'content',
        kind: entry.store,
        payload: p.payload ?? p,
        updated_at: new Date(p.updated_at ?? Date.now()).toISOString(),
      }];

    case 'session_progress':
      // The server keeps one row per kind, so the whole session map travels as
      // a single blob. A per-key write would overwrite every other key.
      return [{
        target: 'content',
        kind: 'session_progress',
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
    case 'learned_sentences':
    case 'wrong_vocab':
    case 'wrong_sentences':
      // Whole-store blobs, handled above as custom_content.
      return [];

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
    const ops = dedupeOps(batch.flatMap(toWireOps));

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

/** Pull remote changes into local storage, then reload so the UI sees them. */
export async function pull(sinceIso?: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return;
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return;

  const { data: content, error: contentError } = await supabase
    .from('custom_content')
    .select('kind, payload, updated_at');

  if (contentError) {
    console.warn('[sync] pull content failed:', contentError.message);
  } else if (content && content.length > 0) {
    const { applyRemoteContent } = await import('./applyRemote');
    const changed = await applyRemoteContent(content);
    if (changed) {
      // Blobs were merged under the React tree; a reload is the only way the
      // in-memory cache and mounted screens agree with what just arrived.
      window.location.reload();
      return;
    }
  }

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
