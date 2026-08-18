import type { Activity, ExerciseEntry, HistoryEntry, Profile, SetEntry } from '../types';
import { addDays, daysTrainedInWeek, fromISO, startOfWeek, todayStr, toISO } from './date';

/** Epley 1RM estimate: 1RM ≈ w × (1 + r/30). Good for ~1–10 reps. */
export function estimate1RM(weightKg: number, reps: number): number {
  if (!weightKg || !reps || reps < 1) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

/** Best estimated 1RM across an exercise's sets. */
export function bestE1RM(sets: SetEntry[]): number {
  return sets.reduce((max, s) => Math.max(max, estimate1RM(s.weight, s.reps)), 0);
}

/** Total volume (kg) for a session, ignoring to-failure sets with unknown load. */
export function sessionVolume(exercises: ExerciseEntry[]): number {
  return exercises.reduce(
    (v, ex) => v + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0,
  );
}

/** Mifflin–St Jeor BMR (kcal/day). Requires weight, height, age, sex. */
export function bmr(weightKg: number, heightCm: number, age: number, sex: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function tdee(weightKg: number, profile: Profile): number | null {
  if (!profile.height || !profile.age || !profile.sex) return null;
  const base = bmr(weightKg, profile.height, profile.age, profile.sex);
  return Math.round(base * (ACTIVITY_FACTOR[profile.activity] ?? 1.55));
}

/** Daily protein target range (g), 1.4–1.8 g/kg. */
export function proteinTarget(weightKg: number): [number, number] {
  return [Math.round(weightKg * 1.4), Math.round(weightKg * 1.8)];
}

/** Daily water target (ml), ~35 ml/kg. */
export function waterTarget(weightKg: number): number {
  return Math.round(weightKg * 35);
}

export type DietGoal = 'cut' | 'maintain' | 'bulk';

/** Calorie offsets (kcal/day vs maintenance) the user can pick per goal. */
export const DIET_RATES: Record<DietGoal, { id: string; label: string; delta: number }[]> = {
  cut: [
    { id: 'lean', label: 'Lean', delta: -300 },
    { id: 'moderate', label: 'Moderate', delta: -500 },
    { id: 'aggressive', label: 'Aggressive', delta: -750 },
  ],
  maintain: [{ id: 'maintain', label: 'Maintain', delta: 0 }],
  bulk: [
    { id: 'lean', label: 'Lean', delta: 200 },
    { id: 'standard', label: 'Standard', delta: 400 },
  ],
};

export interface CaloriePlan {
  calories: number; // target kcal/day (clamped to a sane floor)
  delta: number; // actual kcal/day vs maintenance after clamping
  weeklyKg: number; // estimated weekly bodyweight change (signed kg)
  protein: [number, number]; // daily protein range (g)
}

/** ~7700 kcal per kg of bodyweight change. */
const KCAL_PER_KG = 7700;

/**
 * Turn maintenance calories + a goal/offset into a target plan: calories,
 * the realised daily delta, an estimated weekly weight change, and a
 * goal-appropriate protein range (higher on a cut to spare muscle).
 */
export function caloriePlan(tdeeVal: number, weightKg: number, goal: DietGoal, delta: number): CaloriePlan {
  const calories = Math.max(1200, Math.round((tdeeVal + delta) / 10) * 10);
  const actualDelta = calories - tdeeVal;
  const weeklyKg = Math.round(((actualDelta * 7) / KCAL_PER_KG) * 100) / 100;
  const ppk = goal === 'cut' ? [1.8, 2.2] : goal === 'bulk' ? [1.6, 2.0] : [1.4, 1.8];
  const protein: [number, number] = [Math.round(weightKg * ppk[0]), Math.round(weightKg * ppk[1])];
  return { calories, delta: actualDelta, weeklyKg, protein };
}

/** Rest days each Mon–Sun week absorbs before the streak breaks. */
export const FREEZES_PER_WEEK = 2;

export interface StreakInfo {
  /** Trained days in the current streak. */
  days: number;
  /** Freezes still available in the current week. */
  freezesLeft: number;
  /** Out of freezes this week and haven't trained today. */
  atRisk: boolean;
}

/**
 * Training streak with weekly rest allowance.
 *
 * Walking back from the most recent session, a trained day extends the streak
 * and a rest day spends one of that week's freezes. Weeks run Mon–Sun and each
 * grants two, so an ordinary 4–5 day routine keeps its streak alive while a
 * genuine lapse still ends it. The streak counts trained days, not calendar
 * days — rest days keep it alive without inflating the number.
 */
export function streakInfo(history: HistoryEntry[], todayISO: string = todayStr()): StreakInfo {
  const empty: StreakInfo = { days: 0, freezesLeft: FREEZES_PER_WEEK, atRisk: false };
  if (history.length === 0) return empty;

  const dates = new Set(history.map((h) => h.date));
  const sorted = [...dates].sort();
  const earliest = sorted[0];
  const latest = sorted[sorted.length - 1];

  // Freezes spent between the last session and today decide if it survived.
  const spentByNow = countRestDays(dates, latest, todayISO);
  const weekOfToday = startOfWeek(todayISO);
  if (spentByNow > FREEZES_PER_WEEK) return empty;

  let cursor = fromISO(latest);
  let days = 0;
  // Freezes are per calendar week, so spend them from a per-week purse.
  const spent = new Map<string, number>();
  const spend = (iso: string): boolean => {
    const wk = startOfWeek(iso);
    const used = (spent.get(wk) ?? 0) + 1;
    if (used > FREEZES_PER_WEEK) return false;
    spent.set(wk, used);
    return true;
  };

  // Rest days between the last session and today come out of the purse first.
  for (let d = addDays(fromISO(latest), 1); toISO(d) <= todayISO; d = addDays(d, 1)) {
    if (!dates.has(toISO(d)) && !spend(toISO(d))) return empty;
  }

  while (toISO(cursor) >= earliest) {
    const iso = toISO(cursor);
    if (dates.has(iso)) days++;
    else if (!spend(iso)) break;
    cursor = addDays(cursor, -1);
  }

  const freezesLeft = Math.max(0, FREEZES_PER_WEEK - (spent.get(weekOfToday) ?? 0));
  return { days, freezesLeft, atRisk: freezesLeft === 0 && !dates.has(todayISO) };
}

/** Untrained days strictly between two ISO dates (exclusive of `from`). */
function countRestDays(dates: Set<string>, fromISODate: string, toISODate: string): number {
  let n = 0;
  for (let d = addDays(fromISO(fromISODate), 1); toISO(d) <= toISODate; d = addDays(d, 1)) {
    if (!dates.has(toISO(d))) n++;
  }
  return n;
}

/** Streak length only — the shape every existing caller already expects. */
export function computeStreak(history: HistoryEntry[]): number {
  return streakInfo(history).days;
}

export interface WeekTower {
  /** Monday of the week, ISO. */
  weekStart: string;
  /** Distinct days trained that week, 0–7. */
  days: number;
  /** Short label like "18 Aug". */
  label: string;
  isCurrent: boolean;
}

/**
 * Days trained per calendar week, oldest → newest. Unlike the heatmap grid,
 * these buckets are real Mon–Sun weeks, so a column means what it looks like.
 */
export function weeklyTowers(history: HistoryEntry[], weeks = 12, todayISO: string = todayStr()): WeekTower[] {
  const dates = history.map((h) => h.date);
  const thisWeek = startOfWeek(todayISO);
  const out: WeekTower[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = toISO(addDays(fromISO(thisWeek), -i * 7));
    out.push({
      weekStart,
      days: daysTrainedInWeek(dates, weekStart),
      label: fromISO(weekStart).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      isCurrent: weekStart === thisWeek,
    });
  }
  return out;
}

export interface ConsistencyCell {
  iso: string;
  trained: boolean;
  future: boolean;
  label: string;
}

export interface Consistency {
  cells: ConsistencyCell[];
  grid: ConsistencyCell[][]; // 7 rows × N weeks
  trainedCount: number;
  totalPast: number;
  pct: number;
}

/** 12-week (default) training heatmap, columns are weeks, rows are weekdays. */
export function consistency(history: HistoryEntry[], weeks = 12): Consistency {
  return consistencyFromDates(history.map((h) => h.date), weeks);
}

/** Same heatmap from a bare list of ISO dates (e.g. a friend's published
 *  trained_dates snapshot). */
export function consistencyFromDates(dateList: string[], weeks = 12): Consistency {
  const today = fromISO(todayStr());
  const dates = new Set(dateList);
  const totalDays = weeks * 7;
  const cells: ConsistencyCell[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const iso = toISO(d);
    cells.push({
      iso,
      trained: dates.has(iso),
      future: d > today,
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    });
  }
  const trainedCount = cells.filter((c) => c.trained).length;
  const totalPast = cells.filter((c) => !c.future).length;
  const pct = totalPast === 0 ? 0 : Math.round((trainedCount / totalPast) * 100);

  const grid: ConsistencyCell[][] = [];
  for (let row = 0; row < 7; row++) {
    const rowCells: ConsistencyCell[] = [];
    for (let col = 0; col < weeks; col++) rowCells.push(cells[col * 7 + row]);
    grid.push(rowCells);
  }
  return { cells, grid, trainedCount, totalPast, pct };
}
