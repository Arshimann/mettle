import type { StateStorage } from 'zustand/middleware';

/**
 * Persistence boundary for the app. Today this wraps localStorage; swapping to
 * IndexedDB or a Supabase-backed sync layer later means changing only this file.
 */
export const appStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* quota / privacy mode — ignore */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};
