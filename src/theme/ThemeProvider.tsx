import { useEffect, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { useStore } from '../store/useStore';
import { normalizeSystemPair, normalizeTheme, resolveTheme, THEMES } from './themes';
import { applyAccent, deriveAccent, isHexColor } from './accent';
import { applyDisplayFont } from './displayFont';
import { spring } from './motion';
import { setHapticsEnabled } from '../lib/haptics';

/** Syncs theme, accent override and display font onto <html>, keeps the
 *  browser theme-color honest, and provides app-wide motion defaults. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useStore((s) => s.settings.theme);
  const systemPair = useStore((s) => s.settings.systemPair);
  const accent = useStore((s) => s.settings.accent);
  const displayFont = useStore((s) => s.settings.displayFont);
  const displayFontScope = useStore((s) => s.settings.displayFontScope);
  const haptics = useStore((s) => s.settings.haptics);

  useEffect(() => {
    const mode = normalizeTheme(theme);
    const pair = normalizeSystemPair(systemPair);

    const apply = () => {
      const resolved = resolveTheme(mode, pair);
      const def = THEMES[resolved];
      document.documentElement.dataset.theme = resolved;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', def.canvas);
      // A custom accent rides on top of whichever theme is active — except on
      // themes whose accent IS the identity.
      applyAccent(accent && isHexColor(accent) && !def.accentLocked ? deriveAccent(accent, def.scene) : null);
    };

    apply();
    // In system mode, follow the OS live (e.g. a sunset auto-switch).
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme, systemPair, accent]);

  useEffect(() => {
    void applyDisplayFont(displayFont, displayFontScope);
  }, [displayFont, displayFontScope]);

  useEffect(() => {
    setHapticsEnabled(haptics);
  }, [haptics]);

  return (
    <MotionConfig reducedMotion="user" transition={spring}>
      {children}
    </MotionConfig>
  );
}
