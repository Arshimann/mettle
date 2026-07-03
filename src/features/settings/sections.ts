import { Cloud, Database, Dumbbell, Info, LayoutDashboard, Palette, User, Vibrate, type LucideIcon } from 'lucide-react';

export type SettingsSectionId = 'profile' | 'training' | 'appearance' | 'feel' | 'home' | 'sync' | 'data' | 'about';

export const SETTINGS_SECTIONS: { id: SettingsSectionId; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'You', icon: User },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'feel', label: 'Feel', icon: Vibrate },
  { id: 'home', label: 'Home screen', icon: LayoutDashboard },
  { id: 'sync', label: 'Backup & sync', icon: Cloud },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'about', label: 'About', icon: Info },
];
