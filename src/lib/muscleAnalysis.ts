import type { CustomExercise, HistoryEntry, SetEntry } from '../types';
import { EXERCISE_LIBRARY, type MuscleGroup } from '../data/exercises';
import {
  FIX_EXERCISES,
  REGIONS,
  REGION_ORDER,
  regionsFor,
  resolveRegions,
  type MuscleRegion,
} from '../data/muscleMap';
import { daysBetween, todayStr } from './date';

const LIB_GROUP = new Map<string, MuscleGroup>(EXERCISE_LIBRARY.map((e) => [e.name.toLowerCase(), e.group]));

/**
 * How much one logged set counts toward weekly volume. Cardio contributes
 * nothing (minutes aren't sets), and a set logged as easy counts half — an
 * honest hard-set count is the whole point of the number.
 */
export function hardSetCredit(s: SetEntry): number {
  if (s.durationMin && s.reps === 0) return 0;
  if (s.rpe != null && s.rpe < 7) return 0.5;
  return 1;
}

export interface RegionRow {
  region: MuscleRegion;
  label: string;
  group: MuscleGroup;
  sets: number;
  perWeek: number;
  target: [number, number];
  status: 'none' | 'low' | 'in-range' | 'high';
  drivers: { name: string; sets: number }[];
}

export type FindingKind = 'imbalance' | 'under' | 'over' | 'missing' | 'balanced';

export interface Finding {
  id: string;
  kind: FindingKind;
  severity: number;
  regions: MuscleRegion[];
  headline: string;
  recommendation: string;
  suggestions: string[];
}

export interface MuscleReport {
  weeks: number;
  sessions: number;
  totalSets: number;
  rows: RegionRow[];
  findings: Finding[];
  /** Movements only resolvable at group level — surfaced as a caveat. */
  unmapped: string[];
  /** Too little data to judge; the UI shows a "keep logging" state instead. */
  thin: boolean;
}

/** Pairs whose ratio tells a real training story. */
const SIBLING_PAIRS: [MuscleRegion, MuscleRegion][] = [
  ['front-delt', 'side-delt'],
  ['front-delt', 'rear-delt'],
  ['mid-chest', 'upper-chest'],
  ['quads', 'hams'],
  ['lats', 'rhomboids'],
  ['biceps', 'triceps'],
  ['abs', 'lower-back'],
];

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Advice scaled to the muscle: a small one never needs another whole session. */
function growAdvice(region: MuscleRegion): string {
  const def = REGIONS[region];
  if (def.size === 'small') return `Two or three focused sets, twice a week, is plenty for ${def.label.toLowerCase()}.`;
  if (def.size === 'medium') return `Add three or four sets a week — one extra slot in a session covers it.`;
  return `Worth another session, or two or three more sets each time you train it.`;
}

export function buildMuscleReport(
  history: HistoryEntry[],
  customExercises: CustomExercise[] = [],
  opts: { weeks?: number; today?: string } = {},
): MuscleReport {
  const weeks = opts.weeks ?? 4;
  const today = opts.today ?? todayStr();
  const windowDays = weeks * 7;

  const customGroup = new Map(customExercises.map((c) => [c.name.toLowerCase(), c.group]));
  const setsBy = new Map<MuscleRegion, number>();
  const driversBy = new Map<MuscleRegion, Map<string, number>>();
  const unmapped = new Set<string>();
  let sessions = 0;
  let totalSets = 0;

  for (const h of history) {
    const age = daysBetween(h.date, today);
    if (age < 0 || age >= windowDays) continue;
    sessions++;
    for (const ex of h.exercises) {
      const key = ex.name.toLowerCase();
      const group = LIB_GROUP.get(key) ?? customGroup.get(key);
      const credit = ex.sets.reduce((n, s) => n + hardSetCredit(s), 0);
      if (credit <= 0) continue;
      totalSets += credit;

      const { regions, via } = resolveRegions(ex.name, group);
      if (via === 'group' || via === 'none') unmapped.add(ex.name);

      for (const [region, weight] of Object.entries(regions) as [MuscleRegion, number][]) {
        const add = credit * weight;
        setsBy.set(region, (setsBy.get(region) ?? 0) + add);
        const d = driversBy.get(region) ?? new Map<string, number>();
        d.set(ex.name, (d.get(ex.name) ?? 0) + add);
        driversBy.set(region, d);
      }
    }
  }

  const rows: RegionRow[] = REGION_ORDER.map((region) => {
    const def = REGIONS[region];
    const sets = round1(setsBy.get(region) ?? 0);
    const perWeek = round1(sets / weeks);
    const [min, max] = def.target;
    const status: RegionRow['status'] =
      perWeek <= 0 ? 'none' : perWeek < min ? 'low' : perWeek > max ? 'high' : 'in-range';
    const drivers = [...(driversBy.get(region) ?? new Map())]
      .map(([name, s]) => ({ name, sets: round1(s as number) }))
      .sort((a, b) => b.sets - a.sets)
      .slice(0, 3);
    return { region, label: def.label, group: def.group, sets, perWeek, target: def.target, status, drivers };
  });

  const byRegion = new Map(rows.map((r) => [r.region, r]));
  const findings: Finding[] = [];
  const claimed = new Set<MuscleRegion>();

  // 1. A region at zero while its sibling is trained hard — the loudest signal.
  for (const [a, b] of SIBLING_PAIRS) {
    for (const [x, y] of [
      [a, b],
      [b, a],
    ] as [MuscleRegion, MuscleRegion][]) {
      const rx = byRegion.get(x)!;
      const ry = byRegion.get(y)!;
      if (ry.perWeek <= 0 && rx.perWeek >= 4 && !claimed.has(y)) {
        claimed.add(y);
        findings.push({
          id: `missing:${y}`,
          kind: 'missing',
          severity: 90,
          regions: [y, x],
          headline: `Your ${REGIONS[y].label.toLowerCase()} haven't been trained at all, while ${REGIONS[x].label.toLowerCase()} get ${rx.perWeek} sets a week.`,
          recommendation: growAdvice(y),
          suggestions: FIX_EXERCISES[y].slice(0, 2),
        });
      }
    }
  }

  // 2. Lopsided pairs — the "front delts vs side delts" case.
  for (const [a, b] of SIBLING_PAIRS) {
    const ra = byRegion.get(a)!;
    const rb = byRegion.get(b)!;
    const [big, small] = ra.perWeek >= rb.perWeek ? [ra, rb] : [rb, ra];
    if (small.perWeek <= 0 || big.perWeek < 4) continue;
    const ratio = big.perWeek / small.perWeek;
    if (ratio < 2) continue;
    if (claimed.has(small.region)) continue;
    claimed.add(small.region);
    const shown = ratio >= 10 ? '10×+' : `${round1(ratio)}×`;
    findings.push({
      id: `imb:${big.region}:${small.region}`,
      kind: 'imbalance',
      severity: Math.min(100, 40 + (ratio - 2) * 15) + (small.status === 'low' ? 15 : 0),
      regions: [big.region, small.region],
      headline: `Your ${big.label.toLowerCase()} get ${shown} the work your ${small.label.toLowerCase()} do — ${big.perWeek} sets a week against ${small.perWeek}.`,
      recommendation: growAdvice(small.region),
      suggestions: FIX_EXERCISES[small.region].slice(0, 2),
    });
  }

  // 3. Simply under-trained, where no imbalance already tells the story.
  for (const r of rows) {
    if (claimed.has(r.region) || r.status !== 'low' || r.perWeek <= 0) continue;
    claimed.add(r.region);
    findings.push({
      id: `under:${r.region}`,
      kind: 'under',
      severity: 30 + (1 - r.perWeek / r.target[0]) * 30,
      regions: [r.region],
      headline: `${r.label} sit at ${r.perWeek} sets a week, under the ${r.target[0]}–${r.target[1]} range.`,
      recommendation: growAdvice(r.region),
      suggestions: FIX_EXERCISES[r.region].slice(0, 2),
    });
  }

  // 4. Over-cooked, phrased by muscle size — 19 sets of rear delts is a
  //    different conversation from 19 sets of quads.
  for (const r of rows) {
    if (r.status !== 'high') continue;
    const def = REGIONS[r.region];
    findings.push({
      id: `over:${r.region}`,
      kind: 'over',
      severity: 35,
      regions: [r.region],
      headline: `${r.label} are at ${r.perWeek} sets a week, above the ${r.target[0]}–${r.target[1]} range.`,
      recommendation:
        def.size === 'small'
          ? `That's volume you could spend somewhere it does more.`
          : `Past this point recovery is the limit — sleep and food have to keep up.`,
      suggestions: [],
    });
  }

  findings.sort((a, b) => b.severity - a.severity);
  const top = findings.slice(0, 4);

  if (top.length === 0 && sessions >= 6) {
    top.push({
      id: 'balanced',
      kind: 'balanced',
      severity: 0,
      regions: [],
      headline: 'Nothing looks out of balance right now.',
      recommendation: 'Your volume is spread sensibly across the regions you train. Keep going.',
      suggestions: [],
    });
  }

  return {
    weeks,
    sessions,
    totalSets: round1(totalSets),
    rows,
    findings: top,
    unmapped: [...unmapped],
    thin: sessions < 6,
  };
}

/** Regions a single exercise trains — used by the picker and split quiz. */
export function regionsOf(name: string, group?: MuscleGroup) {
  return regionsFor(name, group);
}
