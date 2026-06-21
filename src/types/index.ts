import type { ThemeId } from '../theme/themes';

export type Units = 'kg' | 'lbs';
export type Sex = 'male' | 'female' | null;
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type TrainingStyle = 'crossfit' | 'bodybuilding' | 'strength' | 'all';

/** Weights are always stored canonically in kilograms. */
export interface SetEntry {
  weight: number; // kg
  reps: number; // logged reps (use toFailure flag instead of a sentinel)
  toFailure?: boolean;
  rpe?: number; // 6–10, optional
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
}

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
}

export interface Supplement {
  id: string;
  name: string;
  dose?: string;
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
}

export interface Settings {
  theme: ThemeId;
  units: Units;
  onboarded: boolean;
  preferredRest: number; // seconds
  restChime: boolean;
  haptics: boolean;
  trainingStyle: TrainingStyle | null;
  tabs: TabToggles;
  display: DisplayToggles;
}

/** In-progress workout. Values are entered as strings, committed to history as numbers. */
export interface ActiveSet {
  weight: string;
  reps: string;
  done: boolean;
  toFailure?: boolean;
  rpe?: number;
}

export interface ActiveExercise {
  name: string;
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
