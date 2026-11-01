/**
 * srs/streak.ts — server-side streak.
 *
 * The authoritative streak is computed on the server from study_events
 * (see supabase/migrations/002_streak.sql), so switching devices does not
 * reset it. The local value in statisticsStorage remains as a fallback for
 * users who are not signed in.
 */

import { getSupabase, isSupabaseConfigured } from '../sync/supabase';

export interface ServerStreak {
  currentStreak: number;
  longestStreak: number;
  lastStudyDay: string | null;
  totalDays: number;
}

export const EMPTY_STREAK: ServerStreak = {
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDay: null,
  totalDays: 0,
};

/**
 * Fetch the server-computed streak.
 * Returns null when the user is not signed in or the request fails —
 * the caller should then fall back to the local statistics.
 */
export async function fetchServerStreak(): Promise<ServerStreak | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;

  const { data, error } = await supabase.rpc('get_streak');
  if (error) {
    console.warn('[streak] get_streak failed:', error.message);
    return null;
  }
  if (!data || data.length === 0) return null;

  const row = data[0] as any;
  return {
    currentStreak: row.current_streak ?? 0,
    longestStreak: row.longest_streak ?? 0,
    lastStudyDay: row.last_study_day ?? null,
    totalDays: row.total_days ?? 0,
  };
}

/** Per-day study summary for the stats dashboard (server-side). */
export interface ServerDaySummary {
  day: string;
  attempts: number;
  correct: number;
  durationMs: number;
}

export async function fetchServerDaySummary(): Promise<ServerDaySummary[] | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;

  const { data, error } = await supabase.rpc('study_day_summary');
  if (error) {
    console.warn('[streak] study_day_summary failed:', error.message);
    return null;
  }
  if (!data) return [];

  return (data as any[]).map((r) => ({
    day: r.day,
    attempts: r.attempts ?? 0,
    correct: r.correct ?? 0,
    durationMs: Number(r.duration_ms ?? 0),
  }));
}
