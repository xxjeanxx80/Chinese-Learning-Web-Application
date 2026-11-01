/**
 * migrate.ts — localStorage → IndexedDB migration.
 *
 * Idempotent: runs once per schema version (MIGRATED_KEY includes version).
 * On failure, leaves MIGRATED_KEY unset so next load retries.
 */

import { dbPut } from './db';
import { STORES, MIGRATED_KEY, SCHEMA_VERSION } from './types';

const versionedKey = `${MIGRATED_KEY}_v${SCHEMA_VERSION}`;

function safeParse(raw: string | null): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function migrateFromLocalStorage(): Promise<void> {
  let already = false;
  try {
    already = !!localStorage.getItem(versionedKey);
  } catch {
    return; // localStorage unavailable (SSR/private mode) — skip
  }
  if (already) return;

  let ok = true;

  // 1. statistics (singleton)
  try {
    const v = safeParse(localStorage.getItem('hsk_statistics'));
    if (v) await dbPut(STORES.STATISTICS, { id: 'singleton', payload: v, updated_at: Date.now() });
  } catch (e) {
    ok = false;
    console.error('migrate statistics failed', e);
  }

  // 2. custom vocabularies (per level → rows)
  try {
    const v = safeParse(localStorage.getItem('hsk_custom_vocabularies'));
    if (v && typeof v === 'object') {
      for (const level of Object.keys(v)) {
        const arr = Array.isArray(v[level]) ? v[level] : [];
        for (const item of arr) {
          await dbPut(STORES.CUSTOM_VOCAB, { id: `cv_${level}_${item.chinese}`, level, payload: item, updated_at: Date.now() });
        }
      }
    }
  } catch (e) {
    ok = false;
    console.error('migrate custom vocab failed', e);
  }

  // 3. vocab overrides
  try {
    const v = safeParse(localStorage.getItem('hsk_vocabulary_overrides'));
    if (v && typeof v === 'object') {
      for (const level of Object.keys(v)) {
        const arr = Array.isArray(v[level]) ? v[level] : [];
        for (const item of arr) {
          await dbPut(STORES.VOCAB_OVERRIDES, { id: `vo_${level}_${item.chinese}`, level, payload: item, updated_at: Date.now() });
        }
      }
    }
  } catch (e) {
    ok = false;
    console.error('migrate vocab overrides failed', e);
  }

  // 4. custom sentences (level -> topic -> sentences[])
  try {
    const v = safeParse(localStorage.getItem('hsk_custom_sentences'));
    if (v && typeof v === 'object') {
      for (const level of Object.keys(v)) {
        const topics = v[level] || {};
        for (const topic of Object.keys(topics)) {
          const arr = Array.isArray(topics[topic]) ? topics[topic] : [];
          for (const item of arr) {
            await dbPut(STORES.CUSTOM_SENTENCES, { id: `cs_${level}_${topic}_${item.chinese}`, level, topic, payload: item, updated_at: Date.now() });
          }
        }
      }
    }
  } catch (e) {
    ok = false;
    console.error('migrate custom sentences failed', e);
  }

  // 5. learned vocabularies (level -> {chinese: item})
  try {
    const v = safeParse(localStorage.getItem('hsk_learned_vocabularies'));
    if (v && typeof v === 'object') {
      for (const level of Object.keys(v)) {
        const items = v[level] || {};
        for (const chinese of Object.keys(items)) {
          await dbPut(STORES.LEARNED_VOCAB, { id: `lv_${level}_${chinese}`, level, chinese, payload: items[chinese], updated_at: Date.now() });
        }
      }
    }
  } catch (e) {
    ok = false;
    console.error('migrate learned vocab failed', e);
  }

  // 6. learned sentences
  try {
    const v = safeParse(localStorage.getItem('hsk_learned_sentences'));
    if (v && typeof v === 'object') {
      for (const level of Object.keys(v)) {
        const items = v[level] || {};
        for (const chinese of Object.keys(items)) {
          await dbPut(STORES.LEARNED_SENTENCES, { id: `ls_${level}_${chinese}`, level, chinese, payload: items[chinese], updated_at: Date.now() });
        }
      }
    }
  } catch (e) {
    ok = false;
    console.error('migrate learned sentences failed', e);
  }

  // 7. wrong answers (level -> WrongAnswer[])
  try {
    const v = safeParse(localStorage.getItem('hsk_wrong_answers'));
    if (v && typeof v === 'object') {
      for (const level of Object.keys(v)) {
        const arr = Array.isArray(v[level]) ? v[level] : [];
        for (const item of arr) {
          await dbPut(STORES.WRONG_VOCAB, { id: `wv_${level}_${item.vocabulary?.chinese ?? item.chinese}`, level, payload: item, updated_at: Date.now() });
        }
      }
    }
  } catch (e) {
    ok = false;
    console.error('migrate wrong vocab failed', e);
  }

  // 8. wrong sentences (level -> topic -> WrongSentence[])
  try {
    const v = safeParse(localStorage.getItem('hsk_sentence_wrong_answers'));
    if (v && typeof v === 'object') {
      for (const level of Object.keys(v)) {
        const topics = v[level] || {};
        for (const topic of Object.keys(topics)) {
          const arr = Array.isArray(topics[topic]) ? topics[topic] : [];
          for (const item of arr) {
            await dbPut(STORES.WRONG_SENTENCES, { id: `ws_${level}_${topic}_${item.sentence?.chinese ?? item.chinese}`, level, topic, payload: item, updated_at: Date.now() });
          }
        }
      }
    }
  } catch (e) {
    ok = false;
    console.error('migrate wrong sentences failed', e);
  }

  // 9. session progress (hsk_session_*)
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('hsk_session_')) keys.push(k);
    }
    for (const k of keys) {
      const v = safeParse(localStorage.getItem(k));
      if (v != null) {
        await dbPut(STORES.SESSION_PROGRESS, { id: k, payload: v, updated_at: Date.now() });
      }
    }
  } catch (e) {
    ok = false;
    console.error('migrate session progress failed', e);
  }

  if (ok) {
    try {
      localStorage.setItem(versionedKey, new Date().toISOString());
    } catch {
      // ignore
    }
  }
}
