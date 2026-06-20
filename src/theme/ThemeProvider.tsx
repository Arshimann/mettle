import { useEffect, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { useStore } from '../store/useStore';
import { THEMES } from './themes';
import { spring } from './motion';
import { setHapticsEnabled } from '../lib/haptics';

/** Syncs the active theme to <html data-theme> and the browser theme-color,
 *  and provides app-wide motion defaults (respecting reduced-motion). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useStore((s) => s.settings.theme);
  const haptics = useStore((s) => s.settings.haptics);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    const canvas = THEMES.find((t) => t.id === theme)?.swatch.canvas;
    if (meta && canvas) meta.setAttribute('content', canvas);
  }, [theme]);

  useEffect(() => {
    setHapticsEnabled(haptics);
  }, [haptics]);

  return (
    <MotionConfig reducedMotion="user" transition={spring}>
      {children}
    </MotionConfig>
  );
}
