import { create } from 'zustand';

export type ScreenId = 'home' | 'split' | 'train' | 'stretch' | 'progress' | 'you' | 'settings';
type Tab = Exclude<ScreenId, 'settings'>;

/** Tab order used to derive transition direction (settings is not a tab). */
export const SCREEN_ORDER: Tab[] = ['home', 'split', 'train', 'stretch', 'progress', 'you'];

interface UIState {
  screen: ScreenId;
  /** +1 = forward (slide left), -1 = backward. Computed in navigate. */
  dir: number;
  /** transient navigation params, e.g. a settings section id or a day id */
  params: Record<string, unknown>;
  /** last real tab visited, so Settings can return where it came from */
  lastTab: Tab;
  navigate: (screen: ScreenId, params?: Record<string, unknown>) => void;
  back: () => void;
}

/** Ephemeral navigation state (not persisted). */
export const useUI = create<UIState>((set, get) => ({
  screen: 'home',
  dir: 1,
  params: {},
  lastTab: 'home',
  navigate: (screen, params = {}) => {
    const cur = get().screen;
    const a = SCREEN_ORDER.indexOf(cur as never);
    const b = SCREEN_ORDER.indexOf(screen as never);
    const dir = a === -1 || b === -1 ? 1 : b >= a ? 1 : -1;
    set((s) => ({ screen, dir, params, lastTab: cur !== 'settings' ? (cur as Tab) : s.lastTab }));
  },
  back: () => get().navigate(get().lastTab),
}));
