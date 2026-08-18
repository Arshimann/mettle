import type { ThemeMode } from '../theme/themes';
import type { MuscleGroup } from '../data/exercises';

export type Units = 'kg' | 'lbs';
export type Sex = 'male' | 'female' | null;
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type TrainingStyle = 'crossfit' | 'bodybuilding' | 'strength' | 'all';

/** Weights are always stored canonically in kilograms. */
export interface SetEntry {
  weight: number; // kg (0 for cardio)
  reps: number; // logged reps (0 for cardio)
  toFailure?: boolean;
  rpe?: number; // 6–10, optional
  /** Cardio: minutes logged instead of weight×reps. */
  durationMin?: number;
  /** Cardio: optional distance, canonical km. */
  distanceKm?: number;
}

export interface ExerciseEntry {
  name: string;
  sets: SetEntry[];
}

export interface HistoryEntry {
  id: string;
  date: string; // YYYY-MM-DD (local)
  dayId: string | null;
  dayName: string;
  exercises: ExerciseEntry[];
  rating?: number; // 1–5
  note?: string;
  durationSec?: number;
  /** Epoch ms the session started. Absent on entries logged before v1.1. */
  startedAt?: number;
}

/** How a template or saved preset lands: swap the split, or add to it. */
export type ApplyMode = 'replace' | 'append';

export interface SplitExercise {
  name: string;
  targetSets?: number;
  targetReps?: string; // e.g. "8–12"
}

export interface SplitDay {
  id: string;
  name: string;
  exercises: SplitExercise[];
}

export interface SavedSplit {
  id: string;
  name: string;
  savedAt: string;
  days: { name: string; exercises: SplitExercise[] }[];
}

export interface PR {
  id: string;
  exercise: string;
  weight: number; // kg
  reps: number;
  date: string;
  note?: string;
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight: number; // kg
  note?: string;
}

export type GoalType = 'lift' | 'bodyweight' | 'frequency' | 'streak' | 'custom';

export interface Goal {
  id: string;
  type: GoalType;
  label: string;
  target: number;
  exercise?: string;
  createdAt: string;
  deadline?: string;
  baseValue?: number;
  /** Set once, the first time the goal is reached — a goal you hit stays hit
   *  even if the underlying number later drops (a weekly count rolls over,
   *  body weight drifts back). */
  completedAt?: string;
}

export interface Supplement {
  id: string;
  name: string;
  dose?: string;
}

/** A user-added exercise, saved to the library for future picks. */
export interface CustomExercise {
  id: string;
  name: string;
  group: MuscleGroup;
}

export interface Achievement {
  id: string;
  unlockedAt: string;
}

export interface Profile {
  height: number | null; // cm
  age: number | null;
  sex: Sex;
  activity: Activity;
}

export interface DisplayToggles {
  stats: boolean;
  dayCards: boolean;
  lastWorkout: boolean;
  streak: boolean;
  weeklyRecap: boolean;
  didYouKnow: boolean;
  upNext: boolean;
}

/** Which optional bottom-nav tabs are visible. Home/Train/You are always on. */
export interface TabToggles {
  split: boolean;
  stretch: boolean;
  recovery: boolean;
  progress: boolean;
  learn: boolean;
  friends: boolean;
}

export interface Settings {
  theme: ThemeMode;
  units: Units;
  onboarded: boolean;
  preferredRest: number; // seconds
  /** Start the rest timer automatically when a set is marked done. */
  autoRest: boolean;
  /** Targets stamped onto exercises added in the split builder. */
  defaultTargetSets: number;
  defaultTargetReps: string;
  restChime: boolean;
  haptics: boolean;
  /** UI sound effects (ticks, pops, fanfare). Rest chime has its own toggle. */
  soundFx: boolean;
  trainingStyle: TrainingStyle | null;
  tabs: TabToggles;
  display: DisplayToggles;
  /** Highest app version whose "What's new" notes the user has seen. */
  lastSeenVersion: string;
}

/** In-progress workout. Values are entered as strings, committed to history as numbers. */
export interface ActiveSet {
  weight: string;
  reps: string;
  done: boolean;
  toFailure?: boolean;
  rpe?: number;
  /** Cardio entry fields (minutes / distance in display units). */
  duration?: string;
  distance?: string;
}

export interface ActiveExercise {
  name: string;
  /** Planned rep range from the split (e.g. "8–12") — shown as placeholder. */
  targetReps?: string;
  sets: ActiveSet[];
}

export interface ActiveSession {
  dayId: string | null;
  dayName: string;
  startedAt: number;
  exercises: ActiveExercise[];
  restEndsAt: number | null;
  restDuration: number | null;
}
