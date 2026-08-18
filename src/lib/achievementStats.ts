import type { HistoryEntry, PR } from '../types';
import type { AchievementStats } from '../data/achievements';
import { EXERCISE_LIBRARY, type MuscleGroup } from '../data/exercises';
import { sessionVolume, streakInfo } from './formulas';
import { daysBetween, daysTrainedInWeek, startOfWeek, todayStr } from './date';

const LIB_GROUP = new Map<string, MuscleGroup>(
  EXERCISE_LIBRARY.map((e) => [e.name.toLowerCase(), e.group]),
);

/**
 * Everything the achievement tests need, computed in one pass over history.
 * Kept out of the component so both the You screen and the post-workout unlock
 * check read from exactly the same numbers.
 */
export function buildAchievementStats(
  history: HistoryEntry[],
  prs: PR[],
  opts: { friends?: number; customGroups?: Map<string, MuscleGroup> } = {},
): AchievementStats {
  const today = todayStr();
  const weekAgo = 7;

  let volume = 0;
  let sets = 0;
  let topSetKg = 0;
  let cardioMin = 0;
  let cardioKm = 0;
  let earlySessions = 0;
  let lateSessions = 0;
  let longestSessionMin = 0;

  const exercises = new Set<string>();
  const weeks = new Set<string>();
  const groupsThisWeek = new Set<MuscleGroup>();

  for (const h of history) {
    volume += sessionVolume(h.exercises);
    weeks.add(startOfWeek(h.date));
    if (h.durationSec) longestSessionMin = Math.max(longestSessionMin, Math.round(h.durationSec / 60));

    // Entries from before v1.1 have no clock time; they simply don't count
    // toward the time-of-day achievements rather than guessing.
    if (h.startedAt) {
      const hour = new Date(h.startedAt).getHours();
      if (hour < 7) earlySessions++;
      else if (hour >= 21) lateSessions++;
    }

    const recent = daysBetween(h.date, today) < weekAgo;
    for (const ex of h.exercises) {
      const key = ex.name.toLowerCase();
      exercises.add(key);
      const group = LIB_GROUP.get(key) ?? opts.customGroups?.get(key);
      if (recent && group && group !== 'Cardio') groupsThisWeek.add(group);
      for (const st of ex.sets) {
        sets++;
        if (st.weight > topSetKg) topSetKg = st.weight;
        if (st.durationMin) cardioMin += st.durationMin;
        if (st.distanceKm) cardioKm += st.distanceKm;
      }
    }
  }

  // Best week, measured the same Mon–Sun way the frequency goal is.
  const dates = history.map((h) => h.date);
  let bestWeek = 0;
  for (const wk of weeks) bestWeek = Math.max(bestWeek, daysTrainedInWeek(dates, wk));

  // A comeback: any two consecutive sessions more than a fortnight apart.
  const sortedDates = [...new Set(dates)].sort();
  let comeback = false;
  for (let i = 1; i < sortedDates.length; i++) {
    if (daysBetween(sortedDates[i - 1], sortedDates[i]) >= 14) {
      comeback = true;
      break;
    }
  }

  return {
    workouts: history.length,
    prs: prs.length,
    streak: streakInfo(history).days,
    exercises: exercises.size,
    volume,
    bestWeek,
    weeksActive: weeks.size,
    cardioMin: Math.round(cardioMin),
    cardioKm: Math.round(cardioKm * 10) / 10,
    // Session clock times aren't stored — only dates — so these stay at zero
    // until a future version records a start timestamp per session.
    earlySessions,
    lateSessions,
    comeback,
    topSetKg,
    sets,
    friends: opts.friends ?? 0,
    groupsThisWeek: groupsThisWeek.size,
    longestSessionMin,
  };
}
