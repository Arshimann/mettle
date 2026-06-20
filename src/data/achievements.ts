import {
  Award,
  Crown,
  Dumbbell,
  Flame,
  Medal,
  Mountain,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface AchievementStats {
  workouts: number;
  prs: number;
  streak: number;
  exercises: number;
  volume: number; // total kg lifted across all history
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  test: (s: AchievementStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first', name: 'First Rep', desc: 'Log your first workout', icon: Dumbbell, test: (s) => s.workouts >= 1 },
  { id: 'ten', name: 'Committed', desc: '10 workouts logged', icon: Medal, test: (s) => s.workouts >= 10 },
  { id: 'fifty', name: 'Regular', desc: '50 workouts logged', icon: Trophy, test: (s) => s.workouts >= 50 },
  { id: 'hundred', name: 'Centurion', desc: '100 workouts logged', icon: Crown, test: (s) => s.workouts >= 100 },
  { id: 'pr1', name: 'Record Breaker', desc: 'Set your first PR', icon: Star, test: (s) => s.prs >= 1 },
  { id: 'pr10', name: 'PR Machine', desc: '10 personal records', icon: Zap, test: (s) => s.prs >= 10 },
  { id: 'streak7', name: 'On Fire', desc: '7-day streak', icon: Flame, test: (s) => s.streak >= 7 },
  { id: 'streak30', name: 'Relentless', desc: '30-day streak', icon: Mountain, test: (s) => s.streak >= 30 },
  { id: 'explorer', name: 'Explorer', desc: '10 different exercises', icon: Target, test: (s) => s.exercises >= 10 },
  { id: 'ton', name: 'Ten Tonnes', desc: '10,000 kg lifted total', icon: Award, test: (s) => s.volume >= 10000 },
];
