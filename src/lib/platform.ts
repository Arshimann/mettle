/** Platform sniffing for the install guide. UA sniffing is inherently fuzzy —
 *  these only pick a sensible default tab / copy, never gate functionality. */

export function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as "Macintosh" but exposes multi-touch.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/** Already running as an installed app (home-screen launch)? */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

/** iOS install only works from Safari proper — Chrome/Firefox shells on iOS
 *  (CriOS/FxiOS) can't add to the home screen. */
export function isIOSNonSafariBrowser(): boolean {
  return isIOS() && /CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}
