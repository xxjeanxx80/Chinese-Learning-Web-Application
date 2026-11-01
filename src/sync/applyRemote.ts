/**
 * sync/applyRemote.ts — merge server rows into local IndexedDB.
 *
 * Conflict rule mirrors the server: LWW by updated_at. A remote row only
 * wins if it is strictly newer than what we have locally.
 */

import { dbPut, dbAll } from '../storage/db';
import { STORES } from '../storage/types';

export interface RemoteLearningItem {
  id: string;
  user_id: string;
  kind: 'vocab' | 'sentence';
  ref_id: string;
  status: string;
  srs_box: number;
  srs_due_at: string | null;
  wrong_count: number;
  deleted: boolean;
  updated_at: string;
}

/** Merge remote learning_items into the local learned_vocab / learned_sentences stores. */
export async function applyRemoteItems(rows: RemoteLearningItem[]): Promise<void> {
  if (!rows || rows.length === 0) return;

  const learnedVocab = await dbAll<any>(STORES.LEARNED_VOCAB);
  const learnedSent = await dbAll<any>(STORES.LEARNED_SENTENCES);
  const vocabMap = new Map<string, any>(learnedVocab.map((r) => [r.id, r]));
  const sentMap = new Map<string, any>(learnedSent.map((r) => [r.id, r]));

  for (const row of rows) {
    const isVocab = row.kind === 'vocab';
    const store = isVocab ? STORES.LEARNED_VOCAB : STORES.LEARNED_SENTENCES;
    const id = `${isVocab ? 'lv' : 'ls'}_${row.kind}_${row.ref_id}`;
    const map = isVocab ? vocabMap : sentMap;

    const existing = map.get(id);
    const existingTs = existing?.updated_at ? new Date(existing.updated_at).getTime() : 0;
    const remoteTs = new Date(row.updated_at).getTime();

    // LWW — only overwrite when remote is strictly newer.
    if (existing && existingTs >= remoteTs) continue;

    const payload = existing?.payload ?? {};
    const next = {
      ...payload,
      status: row.status,
      srs_box: row.srs_box,
      srs_due_at: row.srs_due_at,
      wrong_count: row.wrong_count,
      lastPracticed: remoteTs,
      passedTests: {
        pinyin: row.status === 'mastered' ? true : payload.passedTests?.pinyin ?? false,
        writing: row.status === 'mastered' ? true : payload.passedTests?.writing ?? false,
        meaning: row.status === 'mastered' ? true : payload.passedTests?.meaning ?? false,
      },
    };

    const wrapped = { id, payload: next, updated_at: row.updated_at };
    await dbPut(store, wrapped);
    map.set(id, wrapped);
  }
}
