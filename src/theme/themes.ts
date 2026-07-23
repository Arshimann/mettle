/**
 * One signature look, two scenes. The app has a single cinematic identity;
 * the only choice is Dark (the signature), Light (same film, day scene),
 * or System (follow the device).
 */
export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export const DEFAULT_THEME: ThemeMode = 'dark';

/** Canvas colors per resolved mode — mirrors index.css, feeds <meta theme-color>. */
export const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: '#060608',
  light: '#f7f7f5',
};

export const THEME_OPTIONS: { id: ThemeMode; name: string; tagline: string }[] = [
  { id: 'dark', name: 'Dark', tagline: 'The signature look.' },
  { id: 'light', name: 'Light', tagline: 'Same film, day scene.' },
  { id: 'system', name: 'System', tagline: 'Follows your device.' },
];

/** Map legacy v0.x theme ids (editorial/bold) and junk values onto a valid mode.
 *  Used by the persist migration, cloud-blob imports, and ThemeProvider. */
export function normalizeTheme(value: unknown): ThemeMode {
  if (value === 'dark' || value === 'bold') return 'dark';
  if (value === 'light' || value === 'editorial') return 'light';
  if (value === 'system') return 'system';
  return DEFAULT_THEME;
}

/** Resolve 'system' to the device preference. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }
  return mode;
}
