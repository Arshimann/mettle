import {
  Award,
  Bike,
  CalendarCheck,
  CalendarDays,
  Crown,
  Dumbbell,
  Flame,
  Footprints,
  Gem,
  Heart,
  Medal,
  Moon,
  Mountain,
  Repeat,
  Rocket,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Target,
  Timer,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface AchievementStats {
  workouts: number;
  prs: number;
  streak: number;
  exercises: number;
  volume: number; // total kg lifted across all history
  /** Best single week, counted as distinct days trained Mon–Sun. */
  bestWeek: number;
  /** Distinct weeks with at least one session. */
  weeksActive: number;
  /** Total cardio minutes and km logged. */
  cardioMin: number;
  cardioKm: number;
  /** Sessions started before 07:00 / after 21:00 (by logged date only). */
  earlySessions: number;
  lateSessions: number;
  /** Trained again within a week of a 14+ day gap. */
  comeback: boolean;
  /** Heaviest single set, kg. */
  topSetKg: number;
  /** Sets logged across all history. */
  sets: number;
  /** Friends connected (0 when signed out or unconfigured). */
  friends: number;
  /** Distinct muscle groups trained in the last 7 days. */
  groupsThisWeek: number;
  /** Longest single session, minutes. */
  longestSessionMin: number;
}

export type AchievementTier = 'bronze' | 'silver' | 'gold';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  tier: AchievementTier;
  /** Grouping for the You screen. */
  group: 'Milestones' | 'Strength' | 'Consistency' | 'Exploration' | 'Cardio' | 'Character';
  test: (s: AchievementStats) => boolean;
}

/** Ordered easiest → hardest inside each group, which is also display order. */
export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- Milestones: total workouts ----
  { id: 'first', name: 'First Rep', desc: 'Log your first workout', icon: Dumbbell, tier: 'bronze', group: 'Milestones', test: (s) => s.workouts >= 1 },
  { id: 'ten', name: 'Committed', desc: '10 workouts logged', icon: Medal, tier: 'bronze', group: 'Milestones', test: (s) => s.workouts >= 10 },
  { id: 'twentyfive', name: 'Habit Formed', desc: '25 workouts logged', icon: CalendarCheck, tier: 'bronze', group: 'Milestones', test: (s) => s.workouts >= 25 },
  { id: 'fifty', name: 'Regular', desc: '50 workouts logged', icon: Trophy, tier: 'silver', group: 'Milestones', test: (s) => s.workouts >= 50 },
  { id: 'hundred', name: 'Centurion', desc: '100 workouts logged', icon: Crown, tier: 'gold', group: 'Milestones', test: (s) => s.workouts >= 100 },
  { id: 'twofifty', name: 'Veteran', desc: '250 workouts logged', icon: Gem, tier: 'gold', group: 'Milestones', test: (s) => s.workouts >= 250 },
  { id: 'fivehundred', name: 'Lifer', desc: '500 workouts logged', icon: Rocket, tier: 'gold', group: 'Milestones', test: (s) => s.workouts >= 500 },

  // ---- Strength: PRs, volume, single sets ----
  { id: 'pr1', name: 'Record Breaker', desc: 'Set your first PR', icon: Star, tier: 'bronze', group: 'Strength', test: (s) => s.prs >= 1 },
  { id: 'pr10', name: 'PR Machine', desc: '10 personal records', icon: Zap, tier: 'silver', group: 'Strength', test: (s) => s.prs >= 10 },
  { id: 'pr25', name: 'Always Climbing', desc: '25 personal records', icon: Sparkles, tier: 'gold', group: 'Strength', test: (s) => s.prs >= 25 },
  { id: 'ton', name: 'Ten Tonnes', desc: '10,000 kg lifted total', icon: Award, tier: 'bronze', group: 'Strength', test: (s) => s.volume >= 10_000 },
  { id: 'ton100', name: 'Hundred Tonnes', desc: '100,000 kg lifted total', icon: Mountain, tier: 'silver', group: 'Strength', test: (s) => s.volume >= 100_000 },
  { id: 'ton500', name: 'Half a Megatonne', desc: '500,000 kg lifted total', icon: Crown, tier: 'gold', group: 'Strength', test: (s) => s.volume >= 500_000 },
  { id: 'plates1', name: 'One Plate', desc: 'A single set at 60 kg or more', icon: Dumbbell, tier: 'bronze', group: 'Strength', test: (s) => s.topSetKg >= 60 },
  { id: 'plates2', name: 'Two Plates', desc: 'A single set at 100 kg or more', icon: Medal, tier: 'silver', group: 'Strength', test: (s) => s.topSetKg >= 100 },
  { id: 'plates3', name: 'Three Plates', desc: 'A single set at 140 kg or more', icon: Trophy, tier: 'gold', group: 'Strength', test: (s) => s.topSetKg >= 140 },
  { id: 'sets500', name: 'Set After Set', desc: '500 sets logged', icon: Repeat, tier: 'silver', group: 'Strength', test: (s) => s.sets >= 500 },
  { id: 'sets2000', name: 'Two Thousand Sets', desc: '2,000 sets logged', icon: Gem, tier: 'gold', group: 'Strength', test: (s) => s.sets >= 2000 },

  // ---- Consistency: streaks and weeks ----
  { id: 'streak7', name: 'On Fire', desc: '7-day streak', icon: Flame, tier: 'bronze', group: 'Consistency', test: (s) => s.streak >= 7 },
  { id: 'streak14', name: 'Two Weeks Deep', desc: '14-day streak', icon: Flame, tier: 'silver', group: 'Consistency', test: (s) => s.streak >= 14 },
  { id: 'streak30', name: 'Relentless', desc: '30-day streak', icon: Mountain, tier: 'gold', group: 'Consistency', test: (s) => s.streak >= 30 },
  { id: 'streak100', name: 'Unbreakable', desc: '100-day streak', icon: Crown, tier: 'gold', group: 'Consistency', test: (s) => s.streak >= 100 },
  { id: 'week4', name: 'Four in a Week', desc: 'Train 4 days in one week', icon: CalendarDays, tier: 'bronze', group: 'Consistency', test: (s) => s.bestWeek >= 4 },
  { id: 'week6', name: 'Six in a Week', desc: 'Train 6 days in one week', icon: CalendarCheck, tier: 'silver', group: 'Consistency', test: (s) => s.bestWeek >= 6 },
  { id: 'week7', name: 'No Days Off', desc: 'Train all 7 days of a week', icon: Snowflake, tier: 'gold', group: 'Consistency', test: (s) => s.bestWeek >= 7 },
  { id: 'weeks12', name: 'A Season In', desc: 'Train in 12 different weeks', icon: CalendarDays, tier: 'silver', group: 'Consistency', test: (s) => s.weeksActive >= 12 },
  { id: 'weeks52', name: 'A Year Of It', desc: 'Train in 52 different weeks', icon: Crown, tier: 'gold', group: 'Consistency', test: (s) => s.weeksActive >= 52 },

  // ---- Exploration ----
  { id: 'explorer', name: 'Explorer', desc: '10 different exercises', icon: Target, tier: 'bronze', group: 'Exploration', test: (s) => s.exercises >= 10 },
  { id: 'explorer25', name: 'Curious', desc: '25 different exercises', icon: Target, tier: 'silver', group: 'Exploration', test: (s) => s.exercises >= 25 },
  { id: 'explorer50', name: 'Tried Everything', desc: '50 different exercises', icon: Sparkles, tier: 'gold', group: 'Exploration', test: (s) => s.exercises >= 50 },
  { id: 'wellrounded', name: 'Well Rounded', desc: 'Hit 5 muscle groups in one week', icon: Star, tier: 'silver', group: 'Exploration', test: (s) => s.groupsThisWeek >= 5 },
  { id: 'social1', name: 'Not Alone', desc: 'Add your first friend', icon: Users, tier: 'bronze', group: 'Exploration', test: (s) => s.friends >= 1 },
  { id: 'social5', name: 'Training Circle', desc: 'Five friends connected', icon: Users, tier: 'silver', group: 'Exploration', test: (s) => s.friends >= 5 },

  // ---- Cardio ----
  { id: 'cardio60', name: 'Engine Started', desc: '60 minutes of cardio', icon: Heart, tier: 'bronze', group: 'Cardio', test: (s) => s.cardioMin >= 60 },
  { id: 'cardio600', name: 'Ten Hours In', desc: '600 minutes of cardio', icon: Heart, tier: 'silver', group: 'Cardio', test: (s) => s.cardioMin >= 600 },
  { id: 'km42', name: 'Marathon Distance', desc: '42 km covered in total', icon: Footprints, tier: 'silver', group: 'Cardio', test: (s) => s.cardioKm >= 42 },
  { id: 'km250', name: 'Long Hauler', desc: '250 km covered in total', icon: Bike, tier: 'gold', group: 'Cardio', test: (s) => s.cardioKm >= 250 },

  // ---- Character: the human ones ----
  { id: 'earlybird', name: 'Early Bird', desc: '10 sessions before 7am', icon: Sun, tier: 'silver', group: 'Character', test: (s) => s.earlySessions >= 10 },
  { id: 'nightowl', name: 'Night Owl', desc: '10 sessions after 9pm', icon: Moon, tier: 'silver', group: 'Character', test: (s) => s.lateSessions >= 10 },
  { id: 'comeback', name: 'Back For More', desc: 'Return after two weeks away', icon: Repeat, tier: 'bronze', group: 'Character', test: (s) => s.comeback },
  { id: 'marathonsession', name: 'The Long One', desc: 'A single session over 2 hours', icon: Timer, tier: 'silver', group: 'Character', test: (s) => s.longestSessionMin >= 120 },
];

export const ACHIEVEMENT_GROUPS: AchievementDef['group'][] = [
  'Milestones',
  'Strength',
  'Consistency',
  'Exploration',
  'Cardio',
  'Character',
];
