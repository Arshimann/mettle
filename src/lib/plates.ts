import type { Units } from '../types';

// Plate denominations and bar weight, in the user's display unit.
const PLATES: Record<Units, number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lbs: [45, 35, 25, 10, 5, 2.5],
};
const BAR: Record<Units, number> = { kg: 20, lbs: 45 };

export function defaultBar(units: Units): number {
  return BAR[units];
}

export interface PlateResult {
  plates: { plate: number; count: number }[];
  leftover: number;
  perSide: number;
}

/** Greedy plates loaded per side for a target total and bar weight (display units). */
export function platesPerSide(target: number, bar: number, units: Units): PlateResult {
  const perSide = (target - bar) / 2;
  if (!(perSide > 0)) return { plates: [], leftover: 0, perSide: Math.max(0, perSide || 0) };
  let rem = perSide;
  const out: { plate: number; count: number }[] = [];
  for (const p of PLATES[units]) {
    let count = 0;
    while (rem >= p - 1e-6) {
      rem = Math.round((rem - p) * 1000) / 1000;
      count++;
    }
    if (count) out.push({ plate: p, count });
  }
  return { plates: out, leftover: Math.round(rem * 1000) / 1000, perSide };
}

export interface WarmupSet {
  weight: number;
  reps: number;
}

/** Warm-up ramp toward a working weight (display units): bar, then ~40/60/80%. */
export function warmupSets(working: number, units: Units): WarmupSet[] {
  if (!(working > 0)) return [];
  const bar = BAR[units];
  const inc = units === 'lbs' ? 5 : 2.5;
  const round = (w: number) => Math.max(bar, Math.round(w / inc) * inc);
  const sets: WarmupSet[] = [{ weight: bar, reps: 8 }];
  for (const s of [{ pct: 0.4, reps: 5 }, { pct: 0.6, reps: 3 }, { pct: 0.8, reps: 2 }]) {
    const w = round(working * s.pct);
    if (w > bar && w < working) sets.push({ weight: w, reps: s.reps });
  }
  return sets;
}
