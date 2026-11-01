/**
 * sync/applyRemote.ts — merge server rows into local IndexedDB.
 *
 * Conflict rule mirrors the server: LWW by updated_at. A remote row only
 * wins if it is strictly newer than what we have locally.
 */

import { dbPut, dbGet } from '../storage/db';
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

/**
 * learning_items mirrors SRS scheduling only. The learned and wrong stores are
 * singleton blobs owned by applyRemoteContent, so per-item rows must never be
 * written into them: a row with a non-singleton id comes back as a fake level
 * on the next load and crashes the screen that reads it.
 */
export async function applyRemoteItems(_rows: RemoteLearningItem[]): Promise<void> {
  return;
}

const CONTENT_STORES = new Set<string>([
  STORES.CUSTOM_VOCAB,
  STORES.VOCAB_OVERRIDES,
  STORES.CUSTOM_SENTENCES,
  STORES.LEARNED_VOCAB,
  STORES.LEARNED_SENTENCES,
  STORES.WRONG_VOCAB,
  STORES.WRONG_SENTENCES,
  STORES.STATISTICS,
  STORES.SRS_STATE,
]);

export interface RemoteContent {
  kind: string;
  payload: any;
  updated_at: string;
}

/**
 * Merge server blobs into the singleton stores.
 * Returns true when at least one local row changed, so the caller can reload.
 * A remote blob only wins when it is strictly newer than the local copy.
 */
export async function applyRemoteContent(rows: RemoteContent[]): Promise<boolean> {
  let changed = false;
  for (const row of rows) {
    if (!CONTENT_STORES.has(row.kind) || row.payload == null) continue;
    // A blob store holds one object. A string or array here is a corrupted row
    // from the old per-item sync, and writing it back wipes the local progress.
    if (typeof row.payload !== 'object' || Array.isArray(row.payload)) continue;
    const existing = await dbGet<any>(row.kind, 'singleton');
    const localTs = existing?.updated_at ? new Date(existing.updated_at).getTime() : 0;
    const remoteTs = new Date(row.updated_at).getTime();
    if (localTs >= remoteTs) continue;
    await dbPut(row.kind, { id: 'singleton', payload: row.payload, updated_at: remoteTs });
    changed = true;
  }
  return changed;
}
