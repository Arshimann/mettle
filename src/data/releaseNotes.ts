export interface ReleaseNote {
  version: string;
  date?: string;
  items: string[];
}

/** Newest first. Keep entries short and user-facing — these show in the
 *  "What's new" sheet after an update. */
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '0.10.0',
    date: '2026-07-04',
    items: [
      'Finishing a workout is a moment now — fireworks, your session stats, and a rotating quote (stoics and gym legends included).',
      'Set targets in the split builder (tap an exercise → sets × reps) and Train opens with all your sets ready to fill.',
      'Cardio finally logs like cardio: minutes and distance instead of weight × reps.',
      'New tab order, and both end-workout buttons now ask before ending.',
      'Settings → Training: default rest, auto-start rest timer, and default targets.',
      'Progress trends are grouped by muscle now — way easier to navigate.',
      "Learn split into Insights and Playbook, plus a Coach's read on what you should train more.",
      'Stretch figures completely redrawn, and the guided player got a new look.',
      'Sound effects everywhere (toggle in Settings → Feel) and snappier animations throughout.',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-06-22',
    items: [
      'No more accidental tab swipes — swiping between tabs now only works from the very top or the bottom bar.',
      'Tap any dot on a chart to see the exact number and date behind it.',
      'New starter splits: Bro Split, PHUL, PHAT, Big 3, Push/Pull, Minimalist… and the Bitchsplit. Browse them from the Split tab.',
      'Custom exercises now save to your library — starred, in the category you pick, ready to use again.',
      'More single-arm and single-leg movements to log.',
      'Twice the daily facts, now with sources — and a featured lesson of the day in Learn.',
      'Timer chimes now actually play on iPhone.',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-06-22',
    items: [
      'Update nudge: when a new version ships, you get a quick “Reload” prompt instead of a stale app.',
      'A safety net — if anything ever crashes, you can reload or export your data without losing a thing.',
      'This “What’s new” note, so you always know what changed.',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-06-21',
    items: [
      'Animated figures on every stretch, big in the guided player.',
      'Bigger stretch library plus a “Decompress & grow taller” set — and you can add your own stretches and build routines.',
      'New Recovery tab: gentle, rehab-style mobility by body area. Turn it on in Settings › Appearance.',
      'Bulk / cut calculator in Coach — target calories, weekly change, and protein.',
      'Set your height, age, and weight in one place under Settings › You.',
      'A calmer, grouped You tab.',
    ],
  },
];

/** Numeric semver compare ("0.8.0" vs "0.7.0"). Returns 1 / 0 / -1. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

/** Release notes newer than a given version (for the post-update popup). */
export function notesSince(lastSeen: string): ReleaseNote[] {
  return RELEASE_NOTES.filter((n) => compareVersions(n.version, lastSeen) > 0);
}
