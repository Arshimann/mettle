import {
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Home,
  LayoutGrid,
  PersonStanding,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import type { ScreenId } from '../store/useUI';
import type { TabToggles } from '../types';

export interface NavItem {
  id: Exclude<ScreenId, 'settings'>;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'train', label: 'Train', icon: Dumbbell },
  { id: 'split', label: 'Split', icon: LayoutGrid },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
  { id: 'recovery', label: 'Recovery', icon: HeartPulse },
  { id: 'stretch', label: 'Stretch', icon: PersonStanding },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'you', label: 'You', icon: User },
];

/** Optional tabs are gated by settings; Home / Train / You are always shown. */
const OPTIONAL: Partial<Record<NavItem['id'], keyof TabToggles>> = {
  split: 'split',
  stretch: 'stretch',
  recovery: 'recovery',
  progress: 'progress',
  learn: 'learn',
  friends: 'friends',
};

export function visibleNav(tabs: TabToggles): NavItem[] {
  return NAV.filter((n) => {
    // Friends needs a cloud to talk to — local-first builds never show it.
    if (n.id === 'friends' && !isSupabaseConfigured) return false;
    const key = OPTIONAL[n.id];
    return key ? tabs[key] : true;
  });
}
