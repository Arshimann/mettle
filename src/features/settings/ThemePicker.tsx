import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';
import { spring } from '../../theme/motion';
import { haptics } from '../../lib/haptics';
import { THEME_OPTIONS, THEME_COLORS, normalizeTheme, type ThemeMode } from '../../theme/themes';
import { useStore } from '../../store/useStore';

/** Mini scene preview: dark, light, or a split card for system. */
function Preview({ mode }: { mode: ThemeMode }) {
  const paint = (bg: string, fg: string, accent: string) => (
    <div className="h-full flex-1 p-2.5 flex flex-col justify-between" style={{ background: bg }}>
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
      <span className="text-[15px] font-black leading-none" style={{ color: fg }}>
        Aa
      </span>
    </div>
  );
  return (
    <div className="rounded-[10px] h-16 flex overflow-hidden border border-border">
      {(mode === 'dark' || mode === 'system') && paint(THEME_COLORS.dark, '#f5f5f7', '#6e7bff')}
      {(mode === 'light' || mode === 'system') && paint(THEME_COLORS.light, '#131316', '#5561f2')}
    </div>
  );
}

export function ThemePicker() {
  const theme = normalizeTheme(useStore((s) => s.settings.theme));
  const setTheme = useStore((s) => s.setTheme);

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {THEME_OPTIONS.map((t) => {
        const active = t.id === theme;
        return (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (!active) {
                haptics.select();
                setTheme(t.id);
              }
            }}
            className={cn(
              'relative text-left rounded-card p-1.5 border-2 transition-colors',
              active ? 'border-accent' : 'border-border',
            )}
          >
            <Preview mode={t.id} />
            <div className="px-1 pt-2 pb-0.5">
              <div className="text-[13px] font-semibold leading-tight">{t.name}</div>
              <div className="text-[11px] text-fg-subtle mt-0.5 leading-tight">{t.tagline}</div>
            </div>
            {active && (
              <motion.div
                layoutId="theme-check"
                transition={spring}
                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent bg-accent-grad text-accent-fg grid place-items-center shadow-card"
              >
                <Check size={13} strokeWidth={3} />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
