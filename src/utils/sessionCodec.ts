/**
 * Pure (de)serialisation for session progress.
 *
 * IndexedDB's structured clone stores a Map or a Set as an empty object, and
 * JSON.stringify does the same, so a value that travels through either one
 * comes back without its entries. Persist the tagged plain form and rebuild
 * the collection on read. Anything that is not a real Map or Set — including
 * the empty object an older save left behind — falls back to the caller's
 * default so the screen never calls .values() on a plain object.
 */

export function toStorable(data: unknown): unknown {
  if (data instanceof Map) return { dataType: 'Map', value: Array.from(data.entries()) };
  if (data instanceof Set) return { dataType: 'Set', value: Array.from(data) };
  return data;
}

export function fromStorable<T>(stored: unknown, fallback: T): T {
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    const tagged = stored as { dataType?: string; value?: unknown };
    if (tagged.dataType === 'Map' && Array.isArray(tagged.value)) return new Map(tagged.value) as T;
    if (tagged.dataType === 'Set' && Array.isArray(tagged.value)) return new Set(tagged.value) as T;
  }
  if (Array.isArray(stored) && stored.every((e) => Array.isArray(e) && e.length === 2)) {
    return new Map(stored as [unknown, unknown][]) as T;
  }
  if (fallback instanceof Map || fallback instanceof Set) return fallback;
  return (stored ?? fallback) as T;
}
