/**
 * Custom accent colour. The picked hex has to produce a whole consistent set
 * of tokens — including a foreground that stays readable on it, which is why
 * this computes real WCAG contrast rather than guessing light-or-dark.
 *
 * Applied as inline custom properties on <html>, which beat any [data-theme]
 * rule regardless of specificity and revert cleanly with removeProperty.
 */

export interface AccentTokens {
  accent: string;
  accentFg: string;
  accentSoft: string;
  accentGrad: string;
  accentGlow: string;
  glow: string;
}

export const ACCENT_SWATCHES = [
  '#6e7bff', // signature indigo
  '#5561f2',
  '#0e8f8f',
  '#2dd4a7',
  '#d8ff2e',
  '#f5b545',
  '#ff7a3d',
  '#ff5a5f',
  '#e5341f',
  '#c96bff',
  '#ff6bcb',
  '#8a8f98',
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
const rgbToHex = (r: number, g: number, b: number) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

/** sRGB → linear, per WCAG. */
function linear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Black or white text on this accent, whichever is genuinely more readable.
 * This is what makes volt-yellow take black text while indigo takes white.
 */
export function contrastFg(hex: string): '#ffffff' | '#0a0a0a' {
  return contrast(hex, '#ffffff') >= contrast(hex, '#0a0a0a') ? '#ffffff' : '#0a0a0a';
}

function shiftHue(hex: string, deg: number): string {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let hue = 0;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
  }
  hue = (hue + deg + 360) % 360;

  // HSL → RGB
  const c = (1 - Math.abs(2 * l - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor(hue / 60) % 6;
  const [rr, gg, bb] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][seg];
  return rgbToHex((rr + m) * 255, (gg + m) * 255, (bb + m) * 255);
}

export function deriveAccent(hex: string, scene: 'dark' | 'light'): AccentTokens {
  const [r, g, b] = hexToRgb(hex);
  const dark = scene === 'dark';
  return {
    accent: hex,
    accentFg: contrastFg(hex),
    accentSoft: `rgba(${r}, ${g}, ${b}, ${dark ? 0.16 : 0.1})`,
    // Two-tone diagonal, reproducing the signature look for any hue.
    accentGrad: `linear-gradient(135deg, ${shiftHue(hex, -18)} 0%, ${shiftHue(hex, 18)} 100%)`,
    accentGlow: dark ? `0 0 28px rgba(${r}, ${g}, ${b}, 0.35)` : `0 8px 22px rgba(${r}, ${g}, ${b}, 0.3)`,
    glow: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(${r}, ${g}, ${b}, ${dark ? 0.14 : 0.07}), transparent 60%)`,
  };
}

const PROPS: [string, keyof AccentTokens][] = [
  ['--accent', 'accent'],
  ['--accent-fg', 'accentFg'],
  ['--accent-soft', 'accentSoft'],
  ['--accent-grad', 'accentGrad'],
  ['--accent-glow', 'accentGlow'],
  ['--glow', 'glow'],
];

/** Pass null to drop back to the theme's own accent. */
export function applyAccent(tokens: AccentTokens | null): void {
  const el = document.documentElement;
  for (const [prop, key] of PROPS) {
    if (tokens) el.style.setProperty(prop, tokens[key]);
    else el.style.removeProperty(prop);
  }
}

export const isHexColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
