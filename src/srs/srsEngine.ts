/**
 * srs/srsEngine.ts — Spaced Repetition Scheduling (SM-2, simplified).
 *
 * The scheduling state lives in IndexedDB (SRS_STATE store) and mirrors to
 * the server via `learning_items.srs_box` / `srs_due_at`, so switching
 * devices keeps the review queue intact.
 *
 * Boxes (0-5) map to increasing intervals:
 *   box 0 -> new        -> 10 minutes
 *   box 1 -> learning   -> 1 day
 *   box 2 -> review     -> 3 days
 *   box 3 -> review     -> 7 days
 *   box 4 -> review     -> 14 days
 *   box 5 -> mastered   -> 30 days
 *
 * A wrong answer drops the item back to box 0 (relearn from scratch).
 */

import { readSingleton, writeSingleton, STORES } from '../storage';

export type SrsKind = 'vocab' | 'sentence';

export interface SrsItem {
  kind: SrsKind;
  refId: string;
  box: number;         // 0..5
  dueAt: number;       // epoch ms
  lastReviewed: number;
  reps: number;        // successful reviews in a row
  lapses: number;      // times it was answered wrong
  ease: number;        // 1.3 .. 3.0 (SM-2 style)
}

export interface SrsState {
  [key: string]: SrsItem;
}

const MAX_BOX = 5;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const DEFAULT_EASE = 2.5;

/** Interval in days for a given box. */
const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
/** Interval in minutes for box 0 (new items re-appear the same session). */
const BOX_INTERVAL_MINUTES = 10;

function itemKey(kind: SrsKind, refId: string): string {
  return `${kind}:${refId}`;
}

function getSrsState(): SrsState {
  return readSingleton<SrsState>(STORES.SRS_STATE, {});
}

function saveSrsState(state: SrsState): void {
  void writeSingleton(STORES.SRS_STATE, state);
}

export function getSrsItem(kind: SrsKind, refId: string): SrsItem | null {
  const state = getSrsState();
  return state[itemKey(kind, refId)] ?? null;
}

/**
 * Create (or fetch) the scheduling state for an item.
 * New items start at box 0 and are due immediately.
 */
export function ensureSrsItem(kind: SrsKind, refId: string): SrsItem {
  const state = getSrsState();
  const key = itemKey(kind, refId);
  const existing = state[key];
  if (existing) return existing;

  const item: SrsItem = {
    kind,
    refId,
    box: 0,
    dueAt: Date.now(),
    lastReviewed: 0,
    reps: 0,
    lapses: 0,
    ease: DEFAULT_EASE,
  };
  state[key] = item;
  saveSrsState(state);
  return item;
}

/**
 * Record a review result and reschedule.
 * @param correct true = answered correctly
 */
export function reviewSrsItem(kind: SrsKind, refId: string, correct: boolean): SrsItem {
  const state = getSrsState();
  const key = itemKey(kind, refId);
  const now = Date.now();

  const item: SrsItem = state[key] ?? {
    kind,
    refId,
    box: 0,
    dueAt: now,
    lastReviewed: 0,
    reps: 0,
    lapses: 0,
    ease: DEFAULT_EASE,
  };

  if (correct) {
    item.reps += 1;
    // Ease improves slightly on success, capped.
    item.ease = Math.min(MAX_EASE, item.ease + 0.05);
    item.box = Math.min(MAX_BOX, item.box + 1);
  } else {
    item.lapses += 1;
    // Ease drops on failure, floored.
    item.ease = Math.max(MIN_EASE, item.ease - 0.2);
    item.reps = 0;
    item.box = 0;
  }

  const days = BOX_INTERVAL_DAYS[item.box] ?? BOX_INTERVAL_DAYS[MAX_BOX];
  // A wrong answer is due again immediately, so it shows up in Ôn hôm nay
  // right away instead of disappearing for 10 minutes.
  const ms = !correct
    ? 0
    : item.box === 0
      ? BOX_INTERVAL_MINUTES * 60 * 1000
      : Math.round(days * item.ease * 24 * 60 * 60 * 1000);

  item.dueAt = now + ms;
  item.lastReviewed = now;

  state[key] = item;
  saveSrsState(state);
  return item;
}

/** Items due now (or overdue), newest-due first. */
export function getDueItems(kind?: SrsKind, now = Date.now()): SrsItem[] {
  const state = getSrsState();
  return Object.values(state)
    .filter((i) => i.dueAt <= now)
    .filter((i) => (kind ? i.kind === kind : true))
    .sort((a, b) => a.dueAt - b.dueAt);
}

/** Count of items due today (or overdue). */
export function getDueCount(kind?: SrsKind): number {
  return getDueItems(kind).length;
}

/** All items, for stats. */
export function getAllSrsItems(): SrsItem[] {
  return Object.values(getSrsState());
}

/** Breakdown by box, for the stats dashboard. */
export function getSrsBreakdown(kind?: SrsKind): Record<number, number> {
  const out: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  getAllSrsItems().forEach((i) => {
    if (kind && i.kind !== kind) return;
    out[i.box] = (out[i.box] ?? 0) + 1;
  });
  return out;
}

/** Remove an item from the schedule (e.g. the user deleted the vocabulary). */
export function removeSrsItem(kind: SrsKind, refId: string): void {
  const state = getSrsState();
  delete state[itemKey(kind, refId)];
  saveSrsState(state);
}

/** Clear the whole schedule. */
export function resetSrsState(): void {
  saveSrsState({});
}

/** Human-readable label for a box. */
export const SRS_BOX_LABELS: Record<number, string> = {
  0: 'Mới',
  1: 'Đang học',
  2: 'Ôn 3 ngày',
  3: 'Ôn 1 tuần',
  4: 'Ôn 2 tuần',
  5: 'Thành thạo',
};
