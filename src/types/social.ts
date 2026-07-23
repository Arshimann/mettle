import type { ExerciseEntry } from './index';
import type { MuscleGroup } from '../data/exercises';

/** The four DB privacy flags. Only shareWorkouts (workouts + PRs) and
 *  shareSplit (program + custom movements) gate published data today;
 *  goals/bodyweight are never published anywhere. */
export interface SharedPrivacy {
  shareWorkouts: boolean;
  shareSplit: boolean;
  shareGoals: boolean;
  shareBodyWeight: boolean;
}

export const DEFAULT_PRIVACY: SharedPrivacy = {
  shareWorkouts: true,
  shareSplit: true,
  shareGoals: true,
  shareBodyWeight: true,
};

/** The signed-in user's own shared identity. */
export interface MyShared {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  shareCode: string;
  privacy: SharedPrivacy;
}

export interface FriendSummary {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  streak: number;
}

export interface SharedPR {
  exercise: string;
  weight: number; // kg
  reps: number;
  date: string;
}

export interface SharedCustomExercise {
  name: string;
  group: MuscleGroup;
}

export interface SharedSplitDay {
  name: string;
  exercises: { name: string; targetSets?: number; targetReps?: string }[];
}

/** A friend's full published snapshot (privacy-nulled fields arrive empty). */
export interface FriendProfileData {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  streak: number;
  trainedDates: string[];
  prs: SharedPR[];
  customExercises: SharedCustomExercise[];
  split: SharedSplitDay[] | null;
}

export interface FriendWorkout {
  key: string; // client_id — the reactions/comments workout_key
  userId: string;
  date: string;
  dayName: string;
  exercises: ExerciseEntry[];
  durationSec: number | null;
  prNames: string[];
}

export interface WorkoutReaction {
  workoutKey: string;
  reactorId: string;
  emoji: string;
}

export interface WorkoutComment {
  id: string;
  workoutKey: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface FriendRequestRow {
  id: string;
  fromId: string;
  toId: string;
  displayName: string; // the OTHER party's name
  avatarUrl: string | null;
}

export interface PresenceInfo {
  online: boolean;
  training: boolean;
}
