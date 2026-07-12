/**
 * Utility to persist session-specific study progress (scores, seen items).
 * This ensures progress is not lost on page reload.
 */

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
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error saving session progress for ${mode}_${level}_${subKey}:`, error);
  }
}

/**
 * Load progress for a specific mode and level
 */
export function loadSessionProgress<T>(mode: string, level: string, subKey: string, defaultValue: T): T {
  try {
    const key = `${SESSION_PREFIX}${mode}_${level}_${subKey}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored, reviver) as T;
    }
  } catch (error) {
    console.error(`Error loading session progress for ${mode}_${level}_${subKey}:`, error);
  }
  return defaultValue;
}
