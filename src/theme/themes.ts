export type ThemeId = 'light' | 'dark' | 'editorial' | 'bold';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  /** Representative colors for the picker preview (mirror index.css). */
  swatch: { canvas: string; surface: string; accent: string; fg: string };
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'light',
    name: 'Light & precise',
    tagline: 'Bright, airy, Swiss-grid clean.',
    swatch: { canvas: '#fbfbf9', surface: '#ffffff', accent: '#2f6df6', fg: '#15150f' },
  },
  {
    id: 'dark',
    name: 'Deep premium dark',
    tagline: 'Charcoal with a soft glow.',
    swatch: { canvas: '#0b0b0e', surface: '#141418', accent: '#7c6cff', fg: '#f3f3f5' },
  },
  {
    id: 'editorial',
    name: 'Monochrome editorial',
    tagline: 'Paper, ink, one sharp accent.',
    swatch: { canvas: '#f5f3ec', surface: '#fffefb', accent: '#e5341f', fg: '#0a0a08' },
  },
  {
    id: 'bold',
    name: 'Athletic & bold',
    tagline: 'High contrast, volt energy.',
    swatch: { canvas: '#0a0a0a', surface: '#151515', accent: '#d8ff2e', fg: '#ffffff' },
  },
];

export const DEFAULT_THEME: ThemeId = 'light';

export const THEME_IDS = THEMES.map((t) => t.id);
