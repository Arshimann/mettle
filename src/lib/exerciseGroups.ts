import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type MuscleGroup } from '../data/exercises';
import type { CustomExercise } from '../types';

/**
 * Resolving an exercise name back to its muscle group.
 *
 * Train already did this for Cardio alone, inline, to decide whether a row logs
 * minutes or weight×reps. Sectioning the logger needs the same answer for every
 * group, so the resolution lives here once rather than being re-derived per
 * screen with slightly different rules.
 */

/** Anything we cannot place. Never dropped — an exercise you added must show. */
export type GroupBucketKey = MuscleGroup | 'Other';

const builtIn = new Map<string, MuscleGroup>(
  EXERCISE_LIBRARY.map((e) => [e.name.toLowerCase(), e.group]),
);

/** Case-insensitive lookup: built-ins first, then the user's own movements. */
export function groupOf(name: string, customExercises: CustomExercise[]): MuscleGroup | null {
  const key = name.trim().toLowerCase();
  const hit = builtIn.get(key);
  if (hit) return hit;
  // Customs are a short, mutable list — scanning beats maintaining a cache that
  // has to be invalidated every time one is added or removed.
  return customExercises.find((e) => e.name.toLowerCase() === key)?.group ?? null;
}

/** Lowercased names of every movement logged as minutes/distance, not load. */
export function cardioNames(customExercises: CustomExercise[]): Set<string> {
  const set = new Set<string>();
  EXERCISE_LIBRARY.forEach((e) => {
    if (e.group === 'Cardio') set.add(e.name.toLowerCase());
  });
  customExercises.forEach((e) => {
    if (e.group === 'Cardio') set.add(e.name.toLowerCase());
  });
  return set;
}

export interface GroupBucket<T> {
  group: GroupBucketKey;
  items: T[];
}

/**
 * Bucket a list by muscle group, in MUSCLE_GROUPS order, preserving the
 * original order within each bucket.
 *
 * Generic over the item so callers keep their own shape — Train passes rows
 * carrying their index in the session, which every mutation there depends on,
 * and reshaping that into a name/group pair would lose it.
 */
export function groupExercises<T>(
  items: T[],
  nameOf: (item: T) => string,
  customExercises: CustomExercise[],
): GroupBucket<T>[] {
  const buckets = new Map<GroupBucketKey, T[]>();
  for (const item of items) {
    const key: GroupBucketKey = groupOf(nameOf(item), customExercises) ?? 'Other';
    const list = buckets.get(key);
    if (list) list.push(item);
    else buckets.set(key, [item]);
  }
  const order: GroupBucketKey[] = [...MUSCLE_GROUPS, 'Other'];
  return order
    .filter((g) => buckets.has(g))
    .map((g) => ({ group: g, items: buckets.get(g)! }));
}
