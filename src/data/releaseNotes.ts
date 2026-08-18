export interface ReleaseNote {
  version: string;
  date?: string;
  items: string[];
}

/** Newest first. Keep entries short and user-facing — these show in the
 *  "What's new" sheet after an update. */
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.1.0',
    date: '2026-08-18',
    items: [
      'Insights can finally see individual muscles — not just “shoulders” but “your front delts get 3.5× the work your side delts do”, with the fix suggested and sized to the muscle. No more being told to bury your rear delts in volume.',
      'The Playbook is a real thing now: six sections (Principles, Volume, Intensity, Rest, Recovery, Technique), each with levels that open up as you read, and any article can be read aloud to you.',
      'Two straight answers you asked for: the actual science of getting taller (growth plates, why you shrink during the day, what posture can and can’t fix), and how to optimise your hormones without buying anything.',
      'A physique board. Post check-in photos — private by default, always — and share the ones you want with friends, who can react and comment. Your own photos line up as a timeline you can compare side by side.',
      'Build me a split: answer two questions and it reads your training history to find what you’ve been neglecting, then puts the fix on the right day.',
      'Streaks now have rest days built in — two a week, Mon–Sun. Training 4× a week keeps your streak instead of breaking it.',
      'Achievements actually unlock and stick now, and there are 41 of them across six categories instead of 10.',
      'Progress: switch the chart between estimated 1RM and the weight you actually lifted, plus a Best lifts ranking.',
      'Consistency has a weekly view — a tower per week against your goal — instead of only the day grid.',
      'Templates no longer wipe your split: you choose Add or Replace. Plus single-day templates, an Aesthetics split, and your saved presets are finally reachable.',
      'Edit a training day straight from the Train tab, and cardio now shows live pace and a best-bout record to chase.',
      'Seven themes, including Editorial and Volt returning from the old days, any accent colour you like, and an optional heavy-metal font.',
      'Recovery moved inside Stretch — same content, one less tab.',
      'Home gains today’s lesson, a hand-picked video, friend activity, and 15 more facts. It’ll greet you by name if you set one.',
      'When a lift stalls, the app asks whether it was a deload or fatigue instead of guessing.',
      'New logo.',
    ],
  },
  {
    version: '1.0.1',
    date: '2026-08-18',
    items: [
      'Fixed the app getting clipped under the iPhone’s notch and Dynamic Island — the header now makes room for it properly.',
      'The last card on a page no longer hides behind the floating nav bar.',
      'Weekly goals actually complete now. They count the days you trained this week (Mon–Sun), two sessions in a day count as one day, and once you hit a goal it stays hit.',
      'That little tapping sound on the settings cog and every toggle is gone. Sound is for finishing sets and workouts now.',
      'Ending a workout offers a third option: end without saving.',
      'Forgot your password? There’s a reset link on the login screen now.',
      'The “Day cards” switch on the home screen works — it did nothing before.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-23',
    items: [
      'Mettle 1.0 — a whole new look. One cinematic identity: deep black, glowing accents, film grain, a new display typeface, and a floating nav. Light mode included (Settings → Appearance: Dark / Light / System).',
      'Friends. Add people by share code or name, see who’s online — or training right now — and keep each other honest.',
      'React to your friends’ workouts with 💪 🔥 👏, and talk trash (or spot form) in comments.',
      'Visit a friend’s profile: their streak, consistency calendar, PRs, and recent sessions.',
      'Compare progress head-to-head — estimated-1RM trends and calendars, side by side.',
      'Borrow their custom movements straight into your own library.',
      'Real profile pictures, plus privacy switches for exactly what friends can see.',
      'New install guide with illustrated steps for iPhone and Android — get Mettle on your home screen in ten seconds (Settings → About).',
      'The finish celebration got the film treatment: staged reveal, glow, bigger numbers.',
      'Weight and reps are now capped at 4 digits, so a slipped finger can’t log a 123,456 kg bench.',
    ],
  },
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
