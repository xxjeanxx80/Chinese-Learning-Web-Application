/**
 * syncQueue — append-only outbox for pending writes.
 * Each entry: { id, store, op, payload, ts, retries }.
 * Flushed by SyncEngine (Phase C). In Phase B it just accumulates locally.
 */

import { dbPut, dbAll, dbDelete } from './db';
import { STORES } from './types';

export interface OutboxEntry {
  id: string;
  store: string;
  op: 'put' | 'delete';
  payload: any;
  ts: number;
  retries: number;
}

let counter = 0;
function newId(): string {
  counter += 1;
  return `op_${Date.now()}_${counter}`;
}

export async function enqueue(store: string, op: 'put' | 'delete', payload: any): Promise<string> {
  const id = newId();
  const entry: OutboxEntry = {
    id,
    store,
    op,
    payload,
    ts: Date.now(),
    retries: 0,
  };
  await dbPut(STORES.OUTBOX, { id: entry.id, store, op, payload, ts: entry.ts, retries: entry.retries });
  return entry.id;
}

export async function getPendingOps(): Promise<OutboxEntry[]> {
  const rows = await dbAll<any>(STORES.OUTBOX);
  return rows
    .map((r) => ({
      id: r.id,
      store: r.store,
      op: r.op,
      payload: r.payload,
      ts: r.ts,
      retries: r.retries ?? 0,
    }))
    .sort((a, b) => a.ts - b.ts);
}

export async function removeOp(id: string): Promise<void> {
  await dbDelete(STORES.OUTBOX, id);
}

export async function incrementRetry(id: string): Promise<void> {
  const rows = await dbAll<any>(STORES.OUTBOX);
  const row = rows.find((r) => r.id === id);
  if (!row) return;
  row.retries = (row.retries ?? 0) + 1;
  await dbPut(STORES.OUTBOX, row);
}

export async function pendingCount(): Promise<number> {
  const rows = await dbAll<any>(STORES.OUTBOX);
  return rows.length;
}
