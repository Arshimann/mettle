import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * The Supabase client is OPTIONAL. When the env vars are blank (local-first
 * builds, the preview harness, anyone who hasn't set up a project), this is
 * `null` and every sync path no-ops — the app stays 100% on-device.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Email + password flow — no magic-link URL fragments to parse (also
        // avoids breakage inside an installed PWA).
        detectSessionInUrl: false,
      },
    })
  : null;
