/**
 * storage/index.ts — compatibility layer.
 *
 * Keeps the SYNCHRONOUS API that all *Storage.ts files and components rely on,
 * while backing it with IndexedDB + an in-memory cache.
 *
 * Flow:
 *   1. initStorage() loads every store from IndexedDB into in-memory cache (once).
 *   2. If IndexedDB is empty, migrate from legacy localStorage keys.
 *   3. getX() reads from cache (sync, 0ms).
 *   4. saveX() updates cache + writes IndexedDB async + enqueues outbox op.
 *
 * Component import paths do NOT change: *Storage.ts re-export from here.
 */

import {
  dbPut,
  dbAll,
  dbClear,
  dbDelete,
  dbGet,
} from './db';
import { enqueue } from './syncQueue';
import { migrateFromLocalStorage as runMigration } from './migrate';
import {
  STORES,
} from './types';

// Lazily wired to avoid a circular import (syncEngine -> storage -> syncEngine).
let flushHook: (() => void) | null = null;
export function setFlushHook(fn: () => void): void {
  flushHook = fn;
}
function triggerFlush(): void {
  if (flushHook) flushHook();
}

// ---------- In-memory cache ----------
type CacheMap = Map<string, any>;
const cache: CacheMap = new Map();

let initialized = false;
let initPromise: Promise<void> | null = null;

export function isInitialized(): boolean {
  return initialized;
}

/**
 * Initialize storage: load all stores into cache, migrate from localStorage if needed.
 * Must be awaited before ReactDOM.createRoot.
 */
export async function initStorage(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    // 1. Migrate from legacy localStorage if not done
    await runMigration();

    // 2. A sync bug once wrote per-item rows into the singleton blob stores.
    //    Those rows read back as fake levels and crash the screen, so drop
    //    anything that is not the singleton before the cache is built.
    const blobStores = [
      STORES.CUSTOM_VOCAB, STORES.VOCAB_OVERRIDES, STORES.CUSTOM_SENTENCES,
      STORES.LEARNED_VOCAB, STORES.LEARNED_SENTENCES,
      STORES.WRONG_VOCAB, STORES.WRONG_SENTENCES,
      STORES.STATISTICS, STORES.SETTINGS, STORES.SRS_STATE,
    ];
    for (const storeName of blobStores) {
      const rows = await dbAll<any>(storeName);
      await Promise.all(
        rows.filter((r) => r?.id !== 'singleton').map((r) => dbDelete(storeName, r.id)),
      );
    }

    // 3. Load every store into cache
    for (const storeName of Object.values(STORES)) {
      if (storeName === STORES.OUTBOX) continue;
      const rows = await dbAll<any>(storeName);
      // Single-row stores (statistics, settings) stored under key 'singleton'
      if (storeName === STORES.STATISTICS || storeName === STORES.SETTINGS) {
        const row = rows.find((r) => r.id === 'singleton');
        cache.set(storeName, row ? row.payload : null);
      } else if (storeName === STORES.SESSION_PROGRESS) {
        const map: Record<string, any> = {};
        rows.forEach((r) => {
          map[r.id] = r.payload ?? r;
        });
        cache.set(storeName, map);
      } else {
        cache.set(storeName, rows);
      }
    }
    initialized = true;
  })();
  return initPromise;
}

// ---------- Generic helpers used by *Storage.ts wrappers ----------

/** Read a single JSON blob store (statistics, settings). */
export function readSingleton<T>(store: string, fallback: T): T {
  const v = cache.get(store);
  if (v == null) return fallback;
  return (v && (v as any).payload !== undefined ? (v as any).payload : v) as T;
}

export async function writeSingleton<T>(store: string, value: T): Promise<void> {
  cache.set(store, value);
  await dbPut(store, { id: 'singleton', payload: value, updated_at: Date.now() });
  await enqueue(store, 'put', { id: 'singleton', payload: value });
  triggerFlush();
}

/** Read a keyed map store (session progress). */
export function readKeyedMap(store: string): Record<string, any> {
  const v = cache.get(store);
  if (!v) return {};
  // v may be {id: payload} map already (from init) — unwrap if payload present
  const out: Record<string, any> = {};
  Object.keys(v).forEach((k) => {
    const r = (v as any)[k];
    out[k] = r && r.payload !== undefined ? r.payload : r;
  });
  return out;
}

export async function writeKeyed(store: string, key: string, value: any): Promise<void> {
  const map = readKeyedMap(store);
  map[key] = value;
  cache.set(store, map);
  await dbPut(store, { id: key, payload: value, updated_at: Date.now() });
  await enqueue(store, 'put', { id: key, payload: value });
  triggerFlush();
}

export async function deleteKeyed(store: string, key: string): Promise<void> {
  const map = readKeyedMap(store);
  delete map[key];
  cache.set(store, map);
  await dbDelete(store, key);
  await enqueue(store, 'delete', { id: key });
  triggerFlush();
}

/** Read an array store (custom vocab, wrong answers, etc.) — returns cached raw rows. */
export function readRows<T = any>(store: string): T[] {
  const cached = cache.get(store);
  const rows = Array.isArray(cached) ? cached : [];
  return rows.map((r) => (r && r.payload !== undefined ? r.payload : r)) as T[];
}

export async function writeRows<T = any>(store: string, rows: T[]): Promise<void> {
  cache.set(store, rows);
  // Replace all rows: clear then put. Simpler + idempotent for small datasets.
  await dbClear(store);
  for (const r of rows) {
    const id = (r as any).id ?? `row_${Math.random().toString(36).slice(2)}`;
    await dbPut(store, { id, payload: r, updated_at: Date.now() });
  }
  await enqueue(store, 'put', { rows });
  triggerFlush();
}

// ---------- Migration from legacy localStorage ----------
// (handled by src/storage/migrate.ts via runMigration)

// Re-export STORES for convenience
export { STORES } from './types';
export type { StoreName } from './types';

/**
 * Queue every persisted store for upload.
 * Existing data was written before sync existed, so it never entered the
 * outbox. Called once on sign-in; the server keeps the newer copy (LWW).
 */
export async function enqueueFullSync(): Promise<void> {
  const blobStores = [
    STORES.CUSTOM_VOCAB,
    STORES.VOCAB_OVERRIDES,
    STORES.CUSTOM_SENTENCES,
    STORES.LEARNED_VOCAB,
    STORES.LEARNED_SENTENCES,
    STORES.WRONG_VOCAB,
    STORES.WRONG_SENTENCES,
    STORES.STATISTICS,
    STORES.SRS_STATE,
  ];
  for (const store of blobStores) {
    const row = await dbGet<any>(store, 'singleton');
    if (!row || row.payload == null) continue;
    await enqueue(store, 'put', { id: 'singleton', payload: row.payload, updated_at: row.updated_at });
  }
  const sessions = await dbAll<any>(STORES.SESSION_PROGRESS);
  for (const row of sessions) {
    await enqueue(STORES.SESSION_PROGRESS, 'put', { id: row.id, payload: row.payload, updated_at: row.updated_at });
  }
  // Flush now, not on the 5s debounce: the caller pulls immediately after and
  // must not download a stale server copy before this upload lands.
  const { flush } = await import('../sync/syncEngine');
  await flush();
}
