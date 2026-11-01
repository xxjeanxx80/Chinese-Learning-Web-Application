/**
 * sync/supabase.ts — Supabase client singleton.
 *
 * Region: Southeast Asia (Singapore). Project ref: dljszyawfaeumfdxuqmc.
 *
 * Only the publishable/anon key is used here. It is safe to ship to the
 * browser because Row Level Security rejects any row not owned by auth.uid().
 * The secret/service_role key must NEVER be imported into frontend code.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    console.warn('[sync] Supabase not configured — running local-only.');
    return null;
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'mikuhan_supabase_auth',
      },
      global: {
        headers: { 'X-Client-Info': 'mikuhan-web/1.0' },
      },
    });
  }
  return client;
}
