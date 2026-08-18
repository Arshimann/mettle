import {
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Home,
  LayoutGrid,
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
  // Recovery merged into Stretch in v1.1 — the tab keeps Stretch's slot but
  // takes Recovery's icon, since it now holds both.
  { id: 'stretch', label: 'Stretch', icon: HeartPulse },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'you', label: 'You', icon: User },
];

/** Optional tabs are gated by settings; Home / Train / You are always shown. */
const OPTIONAL: Partial<Record<NavItem['id'], keyof TabToggles>> = {
  split: 'split',
  stretch: 'stretch',
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
