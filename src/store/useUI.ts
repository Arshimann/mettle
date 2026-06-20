import { create } from 'zustand';

export type ScreenId = 'home' | 'split' | 'train' | 'progress' | 'you' | 'settings';

/** Tab order used to derive transition direction (settings is not a tab). */
export const SCREEN_ORDER: Exclude<ScreenId, 'settings'>[] = [
  'home',
  'split',
  'train',
  'progress',
  'you',
];

interface UIState {
  screen: ScreenId;
  /** +1 = navigating forward (slide left), -1 = backward. Computed in navigate. */
  dir: number;
  /** transient navigation params, e.g. a day id to pre-select on the Train screen */
  params: Record<string, unknown>;
  navigate: (screen: ScreenId, params?: Record<string, unknown>) => void;
}

/** Ephemeral navigation state (not persisted). */
export const useUI = create<UIState>((set, get) => ({
  screen: 'home',
  dir: 1,
  params: {},
  navigate: (screen, params = {}) => {
    const a = SCREEN_ORDER.indexOf(get().screen as never);
    const b = SCREEN_ORDER.indexOf(screen as never);
    const dir = a === -1 || b === -1 ? 1 : b >= a ? 1 : -1;
    set({ screen, dir, params });
  },
}));
