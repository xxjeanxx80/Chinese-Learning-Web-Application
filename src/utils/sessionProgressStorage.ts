/**
 * Utility to persist session-specific study progress (scores, seen items).
 * This ensures progress is not lost on page reload.
 */

import { readKeyedMap, writeKeyed, STORES } from '../storage';
import { toStorable, fromStorable } from './sessionCodec';

const SESSION_PREFIX = 'hsk_session_';

/**
 * Save progress for a specific mode and level.
 * The value is stored in its plain tagged form: a live Map or Set would be
 * saved as an empty object by IndexedDB and come back unusable.
 */
export function saveSessionProgress(mode: string, level: string, subKey: string, data: any): void {
  try {
    const key = `${SESSION_PREFIX}${mode}_${level}_${subKey}`;
    const stored = toStorable(data);
    // The practice screens save their state on mount even when nothing has
    // changed. Writing it again would stamp a new time and the next pull would
    // reload the page to fetch what this browser just uploaded.
    const current = readKeyedMap(STORES.SESSION_PROGRESS)[key];
    if (JSON.stringify(current) === JSON.stringify(stored)) return;
    void writeKeyed(STORES.SESSION_PROGRESS, key, stored);
    // The server stores the whole map as one blob, so upload every key, not
    // just the one that changed. Otherwise the next pull wipes the rest.
    void enqueueSessionSync();
  } catch (error) {
    console.error(`Error saving session progress for ${mode}_${level}_${subKey}:`, error);
  }
}

async function enqueueSessionSync(): Promise<void> {
  const { readKeyedMap } = await import('../storage');
  const map = readKeyedMap(STORES.SESSION_PROGRESS);
  const { enqueue } = await import('../storage/syncQueue');
  await enqueue(STORES.SESSION_PROGRESS, 'put', { id: 'singleton', payload: map, updated_at: Date.now() });
}

/**
 * Load progress for a specific mode and level.
 */
export function loadSessionProgress<T>(mode: string, level: string, subKey: string, defaultValue: T): T {
  try {
    const key = `${SESSION_PREFIX}${mode}_${level}_${subKey}`;
    const map = readKeyedMap(STORES.SESSION_PROGRESS);
    const stored = map[key];
    if (stored !== undefined && stored !== null) {
      return fromStorable(stored, defaultValue);
    }
  } catch (error) {
    console.error(`Error loading session progress for ${mode}_${level}_${subKey}:`, error);
  }
  return defaultValue;
}

/** Drop every in-progress session and push the empty map to the server. */
export function clearSessionProgress(): void {
  const map = readKeyedMap(STORES.SESSION_PROGRESS);
  void (async () => {
    const { deleteKeyed } = await import('../storage');
    for (const key of Object.keys(map)) {
      await deleteKeyed(STORES.SESSION_PROGRESS, key);
    }
    const { enqueue } = await import('../storage/syncQueue');
    await enqueue(STORES.SESSION_PROGRESS, 'put', { id: 'singleton', payload: {}, updated_at: Date.now() });
  })();
}
