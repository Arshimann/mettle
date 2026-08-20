import { create } from 'zustand';

export type ScreenId =
  | 'home'
  | 'split'
  | 'train'
  | 'stretch'
  | 'recovery'
  | 'progress'
  | 'learn'
  | 'friends'
  | 'you'
  | 'settings';
type Tab = Exclude<ScreenId, 'settings'>;

/** Tab order used to derive transition direction (settings is not a tab). */
export const SCREEN_ORDER: Tab[] = ['home', 'train', 'split', 'learn', 'stretch', 'progress', 'friends', 'you'];

interface UIState {
  screen: ScreenId;
  /** +1 = forward (slide left), -1 = backward. Computed in navigate. */
  dir: number;
  /** transient navigation params, e.g. a settings section id or a day id */
  params: Record<string, unknown>;
  /** last real tab visited, so Settings can return where it came from */
  lastTab: Tab;
  /** number of open overlays (sheets/modals); swipe-nav is disabled while > 0 */
  overlays: number;
  /** manual re-open of the "What's new" sheet (from Settings → About) */
  whatsNewOpen: boolean;
  /**
   * Achievement ids waiting to be announced. They live here rather than in a
   * component so anything — finishing a session, adding a friend — can raise
   * one, and so the toast survives a screen change.
   */
  unlockedQueue: string[];
  /**
   * A full-screen cinematic moment (session intro, finish celebration) owns the
   * screen. Transient toasts hold their place until it's over rather than
   * burning their few seconds underneath it.
   */
  cinematic: boolean;
  navigate: (screen: ScreenId, params?: Record<string, unknown>) => void;
  back: () => void;
  pushOverlay: () => void;
  popOverlay: () => void;
  setWhatsNewOpen: (open: boolean) => void;
  pushUnlocked: (ids: string[]) => void;
  shiftUnlocked: () => void;
  setCinematic: (on: boolean) => void;
}

/** Ephemeral navigation state (not persisted). */
export const useUI = create<UIState>((set, get) => ({
  screen: 'home',
  dir: 1,
  params: {},
  lastTab: 'home',
  overlays: 0,
  whatsNewOpen: false,
  unlockedQueue: [],
  cinematic: false,
  navigate: (screen, params = {}) => {
    const cur = get().screen;
    const a = SCREEN_ORDER.indexOf(cur as never);
    const b = SCREEN_ORDER.indexOf(screen as never);
    const dir = a === -1 || b === -1 ? 1 : b >= a ? 1 : -1;
    set((s) => ({ screen, dir, params, lastTab: cur !== 'settings' ? (cur as Tab) : s.lastTab }));
  },
  back: () => get().navigate(get().lastTab),
  pushOverlay: () => set((s) => ({ overlays: s.overlays + 1 })),
  popOverlay: () => set((s) => ({ overlays: Math.max(0, s.overlays - 1) })),
  setWhatsNewOpen: (open) => set({ whatsNewOpen: open }),
  pushUnlocked: (ids) =>
    set((s) => ({ unlockedQueue: [...s.unlockedQueue, ...ids.filter((id) => !s.unlockedQueue.includes(id))] })),
  shiftUnlocked: () => set((s) => ({ unlockedQueue: s.unlockedQueue.slice(1) })),
  setCinematic: (on) => set({ cinematic: on }),
}));

