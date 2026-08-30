/**
 * Where links inside auth emails should point.
 *
 * Not simply window.location.origin: a reset requested from a dev server would
 * email a localhost link, which is dead the moment it is opened anywhere but
 * this machine — on a phone, or after the dev server stops. Preview and
 * production origins are used as-is so deploy previews keep working; only a
 * local origin is swapped for the canonical one.
 *
 * Lives here rather than in config.ts because vite.config.ts imports that file,
 * which puts it in the node project where `window` does not exist.
 *
 * Override with VITE_SITE_URL if the app moves.
 */
const CANONICAL_URL = (import.meta.env.VITE_SITE_URL || 'https://mettlegym.netlify.app').replace(
  /\/+$/,
  '',
);

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i;

export function authRedirectUrl(): string {
  if (typeof window === 'undefined') return CANONICAL_URL;
  const origin = window.location.origin;
  return LOCAL_ORIGIN.test(origin) ? CANONICAL_URL : origin;
}
