// Lightweight haptics via the Vibration API. No-ops where unsupported or disabled.
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
  heavy: () => buzz(26),
};
