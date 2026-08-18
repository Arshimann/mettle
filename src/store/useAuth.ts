import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useStore } from './useStore';
import { useSocial } from './useSocial';
import { markLocalChange, pushToCloud, pullFromCloud } from '../lib/sync';

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out';
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline' | 'unconfigured';

export interface AuthActionResult {
  ok: boolean;
  message?: string;
}

interface AuthState {
  /** Whether a Supabase project is wired up at all. */
  configured: boolean;
  status: AuthStatus;
  user: User | null;
  email: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  /** True when the app was opened from a password-reset email — the UI must
   *  ask for a new password before doing anything else. */
  recovery: boolean;

  init: () => void;
  signUp: (email: string, password: string) => Promise<AuthActionResult>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  /** Email a reset link back to this app. */
  resetPassword: (email: string) => Promise<AuthActionResult>;
  /** Set a new password for the recovery session, then leave recovery mode. */
  updatePassword: (password: string) => Promise<AuthActionResult>;
  dismissRecovery: () => void;
}

const online = () => typeof navigator === 'undefined' || navigator.onLine;

let inited = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;

export const useAuth = create<AuthState>((set, get) => ({
  configured: isSupabaseConfigured,
  status: isSupabaseConfigured ? 'loading' : 'signed-out',
  user: null,
  email: null,
  syncStatus: isSupabaseConfigured ? 'idle' : 'unconfigured',
  lastSyncedAt: null,
  error: null,
  recovery: false,

  init: () => {
    if (inited) return;
    inited = true;
    if (!supabase) return; // local-first build — nothing to wire up

    // Password-reset links come back as a URL fragment. The client runs with
    // detectSessionInUrl:false (it breaks inside an installed PWA), so the
    // recovery token is claimed by hand here, then scrubbed from the address
    // bar so a shared or bookmarked URL can't hand out a session.
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      const params = new URLSearchParams(hash.slice(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      history.replaceState(null, '', window.location.pathname + window.location.search);
      if (access_token && refresh_token) {
        void supabase.auth
          .setSession({ access_token, refresh_token })
          .then(({ error }) => set(error ? { error: error.message } : { recovery: true }));
      }
    }

    // Reconcile + back up automatically after the user stops making changes.
    useStore.subscribe(() => {
      markLocalChange();
      const { status, user } = get();
      if (status !== 'signed-in' || !user) return;
      if (!online()) {
        set({ syncStatus: 'offline' });
        return;
      }
      if (pushTimer) clearTimeout(pushTimer);
      set({ syncStatus: 'syncing' });
      pushTimer = setTimeout(async () => {
        const res = await pushToCloud(user.id);
        set(
          res.ok
            ? { syncStatus: 'synced', lastSyncedAt: res.at ?? new Date().toISOString(), error: null }
            : { syncStatus: 'error', error: res.message },
        );
        // Streak/PRs/customs may have changed with any edit — refresh the
        // public snapshot alongside the private blob.
        if (res.ok) useSocial.getState().republish();
      }, 2500);
    });

    // React to sign-in / sign-out / token refresh / the initial restored session.
    supabase.auth.onAuthStateChange((event, session) => {
      // Supabase raises this on its own for recovery sessions in some flows.
      if (event === 'PASSWORD_RECOVERY') set({ recovery: true });
      if (session?.user) {
        const userId = session.user.id;
        set({ status: 'signed-in', user: session.user, email: session.user.email ?? null });
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          // Social boots after sync so backfill sees the reconciled history.
          void get()
            .syncNow()
            .then(() => useSocial.getState().init(userId));
        }
      } else {
        useSocial.getState().teardown();
        set({ status: 'signed-out', user: null, email: null, syncStatus: 'idle' });
      }
    });

    // Resolve the loading state even if no session event lands.
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) set((s) => (s.status === 'loading' ? { status: 'signed-out' } : {}));
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => void get().syncNow());
      window.addEventListener('offline', () => set({ syncStatus: 'offline' }));
    }
  },

  signUp: async (email, password) => {
    if (!supabase) return { ok: false, message: 'Cloud sync is not set up' };
    set({ error: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, message: error.message };
    // Email-confirmation ON → no session yet; user must confirm first.
    if (!data.session) return { ok: true, message: 'Check your email to confirm, then log in.' };
    return { ok: true };
  },

  signIn: async (email, password) => {
    if (!supabase) return { ok: false, message: 'Cloud sync is not set up' };
    set({ error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  },

  signOut: async () => {
    if (pushTimer) clearTimeout(pushTimer);
    if (supabase) await supabase.auth.signOut();
    // Local data stays put — the app keeps working offline.
    set({ status: 'signed-out', user: null, email: null, syncStatus: 'idle', lastSyncedAt: null, recovery: false });
  },

  resetPassword: async (email) => {
    if (!supabase) return { ok: false, message: 'Cloud sync is not set up' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) return { ok: false, message: error.message };
    // Deliberately the same reply whether or not that address has an account —
    // otherwise this doubles as a "does X have a Mettle account" oracle.
    return { ok: true, message: 'If that email has an account, a reset link is on its way.' };
  },

  updatePassword: async (password) => {
    if (!supabase) return { ok: false, message: 'Cloud sync is not set up' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, message: error.message };
    set({ recovery: false });
    return { ok: true };
  },

  dismissRecovery: () => set({ recovery: false }),

  syncNow: async () => {
    const { configured, user } = get();
    if (!configured || !user) return;
    if (!online()) {
      set({ syncStatus: 'offline' });
      return;
    }
    set({ syncStatus: 'syncing', error: null });
    const res = await pullFromCloud(user.id);
    set(
      res.ok
        ? { syncStatus: 'synced', lastSyncedAt: res.at ?? new Date().toISOString(), error: null }
        : { syncStatus: 'error', error: res.message },
    );
  },
}));
