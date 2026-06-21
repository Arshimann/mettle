import type { Activity, ExerciseEntry, HistoryEntry, Profile, SetEntry } from '../types';
import { addDays, fromISO, todayStr, toISO } from './date';

/** Allow one rest day inside a streak before it breaks (matches the original "strict" streak). */
const MAX_REST_GAP = 1;

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

/**
 * Current training streak: consecutive trained days counting back from the most
 * recent workout, allowing a single rest day between sessions. Gone after 3+ idle days.
 */
export function computeStreak(history: HistoryEntry[]): number {
  if (history.length === 0) return 0;
  const dates = new Set(history.map((h) => h.date));
  const sorted = [...dates].sort();
  const earliest = sorted[0];
  const latest = sorted[sorted.length - 1];

  const today = fromISO(todayStr());
  const daysSince = Math.floor((today.getTime() - fromISO(latest).getTime()) / 86400000);
  if (daysSince > 2) return 0;

  let cursor = fromISO(latest);
  let trained = 0;
  let misses = 0;
  while (true) {
    const iso = toISO(cursor);
    if (dates.has(iso)) {
      trained++;
      misses = 0;
    } else {
      misses++;
      if (misses > MAX_REST_GAP) break;
    }
    cursor = addDays(cursor, -1);
    if (toISO(cursor) < earliest) break;
  }
  return trained;
}

/** Consecutive missed days (incl. today) going back from today. */
export function recentMissedDays(history: HistoryEntry[]): number {
  const dates = new Set(history.map((h) => h.date));
  let cursor = fromISO(todayStr());
  let misses = 0;
  while (misses < 7) {
    if (dates.has(toISO(cursor))) break;
    misses++;
    cursor = addDays(cursor, -1);
  }
  return misses;
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
  const today = fromISO(todayStr());
  const dates = new Set(history.map((h) => h.date));
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
