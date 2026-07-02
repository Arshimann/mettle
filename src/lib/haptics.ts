// Lightweight haptics via the Vibration API.
//
// Platform reality: navigator.vibrate exists on Android (Chrome etc.) but NOT
// on iOS Safari / iOS PWAs — Apple never shipped the Vibration API, so on
// iPhone these calls are silent no-ops by design. There is no web workaround.
// The Settings toggle still gates Android; keep it, but don't expect buzz on iOS.
let enabled = true;

export function setHapticsEnabled(v: boolean): void {
  enabled = v;
}

function buzz(pattern: number | number[]): void {
  if (!enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export const haptics = {
  tap: () => buzz(8),
  select: () => buzz(12),
  success: () => buzz([0, 18, 36, 22]),
  warn: () => buzz([0, 30, 50, 30]),
};
