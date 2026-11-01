/**
 * Utility to persist session-specific study progress (scores, seen items).
 * This ensures progress is not lost on page reload.
 */

import { readKeyedMap, writeKeyed, STORES } from '../storage';

const SESSION_PREFIX = 'hsk_session_';

/**
 * Serialization helper for Map and Set
 */
const replacer = (_key: string, value: any) => {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()),
    };
  }
  if (value instanceof Set) {
    return {
      dataType: 'Set',
      value: Array.from(value),
    };
  }
  return value;
};

const reviver = (_key: string, value: any) => {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
    if (value.dataType === 'Set') {
      return new Set(value.value);
    }
  }
  return value;
};

/**
 * Save progress for a specific mode and level
 */
export function saveSessionProgress(mode: string, level: string, subKey: string, data: any): void {
  try {
    const key = `${SESSION_PREFIX}${mode}_${level}_${subKey}`;
    const serialized = JSON.stringify(data, replacer);
    const parsed = JSON.parse(serialized, reviver);
    void writeKeyed(STORES.SESSION_PROGRESS, key, parsed);
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
 * Load progress for a specific mode and level
 */
export function loadSessionProgress<T>(mode: string, level: string, subKey: string, defaultValue: T): T {
  try {
    const key = `${SESSION_PREFIX}${mode}_${level}_${subKey}`;
    const map = readKeyedMap(STORES.SESSION_PROGRESS);
    const stored = map[key];
    if (stored !== undefined && stored !== null) {
      return revive(stored) as T;
    }
  } catch (error) {
    console.error(`Error loading session progress for ${mode}_${level}_${subKey}:`, error);
  }
  return defaultValue;
}

/**
 * IndexedDB stores plain objects, so a Map or Set comes back as
 * {dataType, value}. Rebuild the real collection. Also accept a bare
 * entries array, which is what older saves persisted.
 */
function revive(stored: any): any {
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    if (stored.dataType === 'Map' && Array.isArray(stored.value)) return new Map(stored.value);
    if (stored.dataType === 'Set' && Array.isArray(stored.value)) return new Set(stored.value);
  }
  if (Array.isArray(stored) && stored.every((e) => Array.isArray(e) && e.length === 2)) {
    return new Map(stored);
  }
  return stored;
}
