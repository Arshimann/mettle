import { Dumbbell, Home, LayoutGrid, TrendingUp, User, type LucideIcon } from 'lucide-react';
import type { ScreenId } from '../store/useUI';

export interface NavItem {
  id: Exclude<ScreenId, 'settings'>;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'split', label: 'Split', icon: LayoutGrid },
  { id: 'train', label: 'Train', icon: Dumbbell },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'you', label: 'You', icon: User },
];

export const NAV_ORDER = NAV.map((n) => n.id);
