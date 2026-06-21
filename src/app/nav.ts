import {
  Dumbbell,
  GraduationCap,
  Home,
  LayoutGrid,
  PersonStanding,
  TrendingUp,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { ScreenId } from '../store/useUI';
import type { TabToggles } from '../types';

export interface NavItem {
  id: Exclude<ScreenId, 'settings'>;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'split', label: 'Split', icon: LayoutGrid },
  { id: 'train', label: 'Train', icon: Dumbbell },
  { id: 'stretch', label: 'Stretch', icon: PersonStanding },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
  { id: 'you', label: 'You', icon: User },
];

/** Optional tabs are gated by settings; Home / Train / You are always shown. */
const OPTIONAL: Partial<Record<NavItem['id'], keyof TabToggles>> = {
  split: 'split',
  stretch: 'stretch',
  progress: 'progress',
  learn: 'learn',
};

export function visibleNav(tabs: TabToggles): NavItem[] {
  return NAV.filter((n) => {
    const key = OPTIONAL[n.id];
    return key ? tabs[key] : true;
  });
}
