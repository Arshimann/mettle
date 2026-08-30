import { EXERCISE_LIBRARY, type MuscleGroup } from '../data/exercises';
import { regionsFor, type MuscleRegion } from '../data/muscleMap';
import { STRAIN_OVERRIDES, STRAIN_RULES, type InjuryArea, type StrainScores } from '../data/injuries';
import { groupOf } from './exerciseGroups';
import type { CustomExercise } from '../types';

/**
 * How hard a movement loads a given joint, and what to do instead.
 *
 * Deliberately mechanical. No score here says anything about a person — only
 * about how a movement is loaded — which is the line that keeps this useful
 * without pretending to be medical.
 */

export interface Strain {
  scores: StrainScores;
  /** Empty when we have nothing to say, which is not the same as "safe". */
  reason: string;
}

const EMPTY: Strain = { scores: {}, reason: '' };
const cache = new Map<string, Strain>();

/** Memoised on the hot path — the picker calls this for every visible row. */
export function strainFor(name: string, group?: MuscleGroup): Strain {
  const key = `${name.toLowerCase()}|${group ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const lower = name.trim().toLowerCase();
  let out: Strain = EMPTY;

  const override = STRAIN_OVERRIDES[lower];
  if (override) {
    out = override;
  } else if (group === 'Cardio') {
    out = EMPTY;
  } else {
    for (const rule of STRAIN_RULES) {
      if (!rule.test.test(lower)) continue;
      if (rule.group) {
        const groups = Array.isArray(rule.group) ? rule.group : [rule.group];
        if (!group || !groups.includes(group)) continue;
      }
      out = { scores: rule.scores, reason: rule.reason };
      break;
    }
  }

  cache.set(key, out);
  return out;
}

/** The worst load this movement puts on anything the user flagged. */
export function worstStrain(name: string, group: MuscleGroup | undefined, injuries: InjuryArea[]): number {
  if (injuries.length === 0) return 0;
  const { scores } = strainFor(name, group);
  return injuries.reduce((max, area) => Math.max(max, scores[area] ?? 0), 0);
}

/** The clause explaining the worst load, for the badge. */
export function strainReason(name: string, group?: MuscleGroup): string {
  return strainFor(name, group).reason;
}

function primaryRegion(name: string, group?: MuscleGroup): MuscleRegion | null {
  const regions = regionsFor(name, group) as Record<string, number>;
  const sorted = Object.entries(regions).sort((a, b) => b[1] - a[1]);
  return sorted.length ? (sorted[0][0] as MuscleRegion) : null;
}

/**
 * Movements that train the same thing with less load on the flagged joints.
 *
 * Same primary region, strictly gentler, best overlap first — so the suggestion
 * is a real substitute rather than merely a different exercise.
 */
export function gentlerAlternatives(
  name: string,
  group: MuscleGroup | undefined,
  injuries: InjuryArea[],
  customExercises: CustomExercise[] = [],
  limit = 3,
): string[] {
  if (injuries.length === 0) return [];
  const mineStrain = worstStrain(name, group, injuries);
  if (mineStrain <= 0) return [];

  const primary = primaryRegion(name, group);
  if (!primary) return [];
  const mineRegions = regionsFor(name, group) as Record<string, number>;
  const lower = name.toLowerCase();

  const pool = [
    ...EXERCISE_LIBRARY,
    ...customExercises.map((c) => ({ name: c.name, group: c.group })),
  ];

  return pool
    .filter((e) => e.name.toLowerCase() !== lower && e.group !== 'Cardio')
    .map((e) => {
      const theirs = regionsFor(e.name, e.group) as Record<string, number>;
      let overlap = 0;
      for (const [region, weight] of Object.entries(mineRegions)) {
        overlap += Math.min(weight, theirs[region] ?? 0);
      }
      return {
        name: e.name,
        primaryScore: theirs[primary] ?? 0,
        overlap,
        strain: worstStrain(e.name, e.group, injuries),
      };
    })
    .filter((x) => x.primaryScore > 0 && x.strain < mineStrain)
    .sort((a, b) => a.strain - b.strain || b.primaryScore - a.primaryScore || b.overlap - a.overlap)
    .slice(0, limit)
    .map((x) => x.name);
}

/** "Kind on my shoulder" / "Kind on my joints" for the filter chip. */
export function kindLabel(injuries: InjuryArea[], labelOf: (a: InjuryArea) => string): string {
  if (injuries.length === 1) return `Kind on my ${labelOf(injuries[0]).toLowerCase()}`;
  return 'Kind on my joints';
}

/** Convenience for callers that only have a name and the user's customs. */
export function strainForName(
  name: string,
  customExercises: CustomExercise[],
  injuries: InjuryArea[],
): { score: number; reason: string } {
  const group = groupOf(name, customExercises) ?? undefined;
  return { score: worstStrain(name, group, injuries), reason: strainReason(name, group) };
}
