/**
 * srs/eventQueue.ts — queue study events for the server.
 *
 * Each answer produces one event. Events are appended to the local outbox
 * with target='event' and a client-generated UUID, so the server can dedupe
 * them (ON CONFLICT DO NOTHING) — a retried batch never double-counts.
 *
 * The server computes streaks from these events, which is why they must be
 * written even when the local statistics are already up to date.
 */

import { enqueue } from '../storage/syncQueue';
import { STORES } from '../storage/types';

export interface StudyEvent {
  kind: 'answer' | 'session_end' | 'review';
  level?: string;
  correct?: boolean;
  durationMs?: number;
  meta?: Record<string, any>;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Record a study event locally and queue it for the server.
 * Fire-and-forget: never blocks the UI.
 */
export function recordStudyEvent(event: StudyEvent): void {
  const id = uuid();
  const payload = {
    id,
    ts: new Date().toISOString(),
    kind: event.kind,
    level: event.level ?? null,
    correct: event.correct ?? null,
    duration_ms: event.durationMs ?? null,
    meta: event.meta ?? null,
    updated_at: Date.now(),
  };
  void enqueue(STORES.STATISTICS, 'put', { id: `event_${id}`, payload });
}
