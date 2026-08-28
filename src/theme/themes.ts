/**
 * Theme registry. Metadata lives here; the actual token blocks live in
 * index.css under [data-theme='…'] — switching is a single attribute write,
 * which is why there's no flash and no JS repaint cost.
 */

export type ThemeId = 'dark' | 'light' | 'editorial' | 'bold' | 'ember' | 'sea' | 'carbon';
/** What `settings.theme` holds — a concrete theme, or follow the OS. */
export type ThemeMode = ThemeId | 'system';

export interface ThemeDef {
  id: ThemeId;
  label: string;
  tagline: string;
  /** Which OS appearance this belongs to, and how `system` pairs them. */
  scene: 'dark' | 'light';
  /** Drives <meta theme-color> — must match --canvas in index.css. */
  canvas: string;
  preview: { fg: string; accent: string };
  /** editorial's red is the identity; a custom accent would destroy it. */
  accentLocked?: boolean;
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  dark: {
    id: 'dark',
    label: 'Signature',
    tagline: 'Near-black, indigo glow',
    scene: 'dark',
    canvas: '#060608',
    preview: { fg: '#f5f5f7', accent: '#6e7bff' },
  },
  light: {
    id: 'light',
    label: 'Daylight',
    tagline: 'Porcelain, same film',
    scene: 'light',
    canvas: '#f7f7f5',
    preview: { fg: '#131316', accent: '#5561f2' },
  },
  carbon: {
    id: 'carbon',
    label: 'Carbon',
    tagline: 'Pure monochrome',
    scene: 'dark',
    canvas: '#000000',
    preview: { fg: '#fafafa', accent: '#fafafa' },
  },
  ember: {
    id: 'ember',
    label: 'Ember',
    tagline: 'Warm charcoal, molten orange',
    scene: 'dark',
    canvas: '#0d0a09',
    preview: { fg: '#f7f0ea', accent: '#ff7a3d' },
  },
  bold: {
    id: 'bold',
    label: 'Volt',
    tagline: 'High contrast, springy',
    scene: 'dark',
    canvas: '#0a0a0a',
    preview: { fg: '#ffffff', accent: '#d8ff2e' },
  },
  sea: {
    id: 'sea',
    label: 'Sea',
    tagline: 'Cool porcelain, deep teal',
    scene: 'light',
    canvas: '#f2f6f6',
    preview: { fg: '#0d2222', accent: '#0e8f8f' },
  },
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    tagline: 'Warm paper, sharp red',
    scene: 'light',
    canvas: '#f5f3ec',
    preview: { fg: '#0a0a08', accent: '#e5341f' },
    accentLocked: true,
  },
};

export const THEME_LIST: ThemeDef[] = [
  THEMES.dark,
  THEMES.light,
  THEMES.carbon,
  THEMES.ember,
  THEMES.bold,
  THEMES.sea,
  THEMES.editorial,
];


/** Kept for callers that only need id → canvas colour. */

export const DEFAULT_THEME: ThemeMode = 'dark';

/** Which themes `system` alternates between. */
export interface SystemPair {
  dark: ThemeId;
  light: ThemeId;
}

export const DEFAULT_SYSTEM_PAIR: SystemPair = { dark: 'dark', light: 'light' };

const isThemeId = (v: unknown): v is ThemeId => typeof v === 'string' && v in THEMES;

/** Accepts any known id or 'system'; anything else falls back to the default. */
export function normalizeTheme(value: unknown): ThemeMode {
  if (value === 'system' || isThemeId(value)) return value;
  return DEFAULT_THEME;
}

export function normalizeSystemPair(value: unknown): SystemPair {
  const v = (value ?? {}) as Partial<SystemPair>;
  return {
    dark: isThemeId(v.dark) && THEMES[v.dark].scene === 'dark' ? v.dark : DEFAULT_SYSTEM_PAIR.dark,
    light: isThemeId(v.light) && THEMES[v.light].scene === 'light' ? v.light : DEFAULT_SYSTEM_PAIR.light,
  };
}

export function resolveTheme(mode: ThemeMode, pair: SystemPair = DEFAULT_SYSTEM_PAIR): ThemeId {
  if (mode !== 'system') return mode;
  const prefersLight =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? pair.light : pair.dark;
}
