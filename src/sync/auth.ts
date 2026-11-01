/**
 * sync/auth.ts — Supabase authentication (email OTP / magic link).
 *
 * Token handling is delegated entirely to the Supabase SDK, which stores the
 * session in localStorage under 'mikuhan_supabase_auth' and refreshes it
 * automatically. We never hand-roll token storage.
 */

import { getSupabase, isSupabaseConfigured } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export type AuthState = 'loading' | 'signed-out' | 'signed-in';

const listeners = new Set<(state: AuthState, user: User | null) => void>();
let state: AuthState = 'loading';
let currentUser: User | null = null;

export function getAuthState(): AuthState {
  return state;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function onAuthChange(fn: (state: AuthState, user: User | null) => void): () => void {
  listeners.add(fn);
  fn(state, currentUser);
  return () => listeners.delete(fn);
}

function emit(s: AuthState, u: User | null) {
  state = s;
  currentUser = u;
  listeners.forEach((fn) => fn(s, u));
}

/** Send a magic-link / OTP email. */
export async function sendMagicLink(email: string): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) {
    return { ok: false, message: 'Supabase chưa được cấu hình.' };
  }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Đã gửi link đăng nhập tới email. Kiểm tra hộp thư.' };
}

/** Sign out and clear the session. */
export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  emit('signed-out', null);
}

/** Initialise auth state and subscribe to session changes. */
export async function initAuth(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) {
    emit('signed-out', null);
    return;
  }

  const { data } = await supabase.auth.getSession();
  emit(data.session ? 'signed-in' : 'signed-out', data.session?.user ?? null);

  supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
    emit(session ? 'signed-in' : 'signed-out', session?.user ?? null);
  });
}
