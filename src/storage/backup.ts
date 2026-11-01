/**
 * backup.ts — full app data export/import as a single JSON file.
 *
 * Dumps every IndexedDB-backed store (custom vocab, overrides, sentences,
 * learned items, wrong answers, statistics, session progress) into one JSON
 * blob. Independent of the backend — works purely on local IndexedDB, so it
 * is a safety net even before Supabase sync exists.
 *
 * Format:
 *   {
 *     version: 1,
 *     exportedAt: ISO string,
 *     stores: {
 *       custom_vocab: [...],
 *       vocab_overrides: [...],
 *       ...
 *     }
 *   }
 */

import { dbAll, dbClear, dbPut } from './db';
import { STORES } from './types';

export const BACKUP_VERSION = 1;

export interface BackupData {
  version: number;
  exportedAt: string;
  stores: Record<string, any[]>;
}

/** Collect every store (except outbox) into a plain object of arrays. */
async function collectStores(): Promise<Record<string, any[]>> {
  const stores: Record<string, any[]> = {};
  for (const storeName of Object.values(STORES)) {
    if (storeName === STORES.OUTBOX) continue;
    const rows = await dbAll<any>(storeName);
    // unwrap payload wrapper so the file holds raw rows
    stores[storeName] = rows.map((r) => (r && r.payload !== undefined ? r.payload : r));
  }
  return stores;
}

/** Build the backup object. */
export async function buildBackup(): Promise<BackupData> {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    stores: await collectStores(),
  };
}

/** Export the full backup as a downloadable JSON file. */
export async function exportBackup(): Promise<void> {
  const backup = await buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `mikuhan-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a backup file.
 * @param file uploaded JSON file
 * @param mode 'merge' keeps existing rows, 'replace' wipes each store first
 * @returns { added, replaced, errors }
 */
export async function importBackup(
  file: File,
  mode: 'merge' | 'replace' = 'replace'
): Promise<{ added: number; replaced: number; errors: number }> {
  let parsed: BackupData;
  try {
    parsed = JSON.parse(await file.text()) as BackupData;
  } catch {
    return { added: 0, replaced: 0, errors: 1 };
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.stores) {
    return { added: 0, replaced: 0, errors: 1 };
  }

  let added = 0;
  let replaced = 0;
  let errors = 0;

  for (const storeName of Object.values(STORES)) {
    if (storeName === STORES.OUTBOX) continue;
    const rows = parsed.stores[storeName];
    if (!Array.isArray(rows)) continue;

    try {
      if (mode === 'replace') {
        await dbClear(storeName);
      }
      for (const row of rows) {
        const id = (row as any).id ?? `row_${Math.random().toString(36).slice(2)}`;
        const wrapped = { id, payload: row, updated_at: Date.now() };
        await dbPut(storeName, wrapped);
        replaced++;
      }
      added += rows.length;
    } catch (e) {
      errors++;
      console.error('importBackup failed for', storeName, e);
    }
  }

  return { added, replaced, errors };
}
