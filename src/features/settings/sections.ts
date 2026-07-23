import { Cloud, Database, Dumbbell, Info, LayoutDashboard, Palette, User, Users, Vibrate, type LucideIcon } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export type SettingsSectionId =
  | 'profile'
  | 'training'
  | 'appearance'
  | 'feel'
  | 'home'
  | 'social'
  | 'sync'
  | 'data'
  | 'about';

export const SETTINGS_SECTIONS: { id: SettingsSectionId; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'You', icon: User },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'feel', label: 'Feel', icon: Vibrate },
  { id: 'home', label: 'Home screen', icon: LayoutDashboard },
  // Social only exists when a cloud is wired up.
  ...(isSupabaseConfigured ? [{ id: 'social' as const, label: 'Friends & privacy', icon: Users }] : []),
  { id: 'sync', label: 'Backup & sync', icon: Cloud },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'about', label: 'About', icon: Info },
];
