import type { HistoryEntry, SetEntry, Units } from '../types';
import { loadIncrement, toKg } from './units';

export interface LastPerf {
  date: string;
  sets: SetEntry[];
  top: SetEntry;
}

/** Most recent logged performance of an exercise (history is newest-first). */
export function lastPerformance(history: HistoryEntry[], name: string): LastPerf | null {
  const lower = name.toLowerCase();
  for (const h of history) {
    const ex = h.exercises.find((e) => e.name.toLowerCase() === lower);
    if (ex && ex.sets.length) {
      const top = ex.sets.reduce((m, s) => (s.weight > m.weight ? s : m), ex.sets[0]);
      return { date: h.date, sets: ex.sets, top };
    }
  }
  return null;
}

/**
 * Progressive-overload nudge (kg). If the last top set hit 8+ reps, bump the
 * weight by one increment; otherwise hold weight to build reps first.
 */
export function suggestNextKg(history: HistoryEntry[], name: string, units: Units): number | null {
  const lp = lastPerformance(history, name);
  if (!lp) return null;
  const incKg = toKg(loadIncrement(units), units);
  if (lp.top.reps >= 8) return Math.round((lp.top.weight + incKg) * 100) / 100;
  return lp.top.weight;
}
