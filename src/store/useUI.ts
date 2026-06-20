import { create } from 'zustand';

export type ScreenId = 'home' | 'split' | 'train' | 'progress' | 'you' | 'settings';

interface UIState {
  screen: ScreenId;
  /** transient navigation params, e.g. a day id to pre-select on the Train screen */
  params: Record<string, unknown>;
  navigate: (screen: ScreenId, params?: Record<string, unknown>) => void;
}

/** Ephemeral navigation state (not persisted). */
export const useUI = create<UIState>((set) => ({
  screen: 'home',
  params: {},
  navigate: (screen, params = {}) => set({ screen, params }),
}));
