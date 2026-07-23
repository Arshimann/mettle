import { useEffect, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { useStore } from '../store/useStore';
import { normalizeTheme, resolveTheme, THEME_COLORS } from './themes';
import { spring } from './motion';
import { setHapticsEnabled } from '../lib/haptics';

/** Syncs the active theme to <html data-theme> and the browser theme-color,
 *  and provides app-wide motion defaults (respecting reduced-motion). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useStore((s) => s.settings.theme);
  const haptics = useStore((s) => s.settings.haptics);

  useEffect(() => {
    const mode = normalizeTheme(theme);
    const apply = () => {
      const resolved = resolveTheme(mode);
      document.documentElement.dataset.theme = resolved;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', THEME_COLORS[resolved]);
    };
    apply();
    // In system mode, follow the OS live (e.g. sunset auto-switch).
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
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
