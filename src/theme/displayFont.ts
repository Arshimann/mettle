/**
 * The heavy-metal display face, loaded only if someone turns it on — it's a
 * single-purpose display font most users will never enable, so it stays off
 * the critical path until asked for.
 */

export type DisplayFont = 'default' | 'metal';
export type FontScope = 'wordmark' | 'headings';

let loading: Promise<void> | null = null;

export function ensureMetalFont(): Promise<void> {
  loading ??= import('@fontsource/metal-mania/400.css').then(() => undefined);
  return loading;
}

export async function applyDisplayFont(font: DisplayFont, scope: FontScope): Promise<void> {
  const el = document.documentElement;
  if (font !== 'metal') {
    delete el.dataset.font;
    delete el.dataset.fontScope;
    return;
  }
  await ensureMetalFont();
  el.dataset.font = 'metal';
  el.dataset.fontScope = scope;
}
