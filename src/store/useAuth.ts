import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useStore } from './useStore';
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

  init: () => void;
  signUp: (email: string, password: string) => Promise<AuthActionResult>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
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

  init: () => {
    if (inited) return;
    inited = true;
    if (!supabase) return; // local-first build — nothing to wire up

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
      }, 2500);
    });

    // React to sign-in / sign-out / token refresh / the initial restored session.
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        set({ status: 'signed-in', user: session.user, email: session.user.email ?? null });
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') void get().syncNow();
      } else {
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
    set({ status: 'signed-out', user: null, email: null, syncStatus: 'idle', lastSyncedAt: null });
  },

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
