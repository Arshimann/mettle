import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';
import { spring } from '../../theme/motion';
import { haptics } from '../../lib/haptics';
import { THEMES } from '../../theme/themes';
import { useStore } from '../../store/useStore';

export function ThemePicker() {
  const theme = useStore((s) => s.settings.theme);
  const setTheme = useStore((s) => s.setTheme);

  return (
    <div className="grid grid-cols-2 gap-3">
      {THEMES.map((t) => {
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
            <div
              className="rounded-[10px] p-3 h-20 flex flex-col justify-between overflow-hidden"
              style={{ background: t.swatch.canvas }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-9 h-3 rounded-full"
                  style={{ background: t.swatch.surface, boxShadow: '0 0 0 1px rgba(128,128,128,0.18)' }}
                />
                <span className="w-3 h-3 rounded-full" style={{ background: t.swatch.accent }} />
              </div>
              <div className="text-lg font-black leading-none" style={{ color: t.swatch.fg }}>
                Aa
              </div>
            </div>
            <div className="px-1.5 pt-2 pb-0.5">
              <div className="text-[13px] font-semibold leading-tight">{t.name}</div>
              <div className="text-[11px] text-fg-subtle mt-0.5 leading-tight">{t.tagline}</div>
            </div>
            {active && (
              <motion.div
                layoutId="theme-check"
                transition={spring}
                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent text-accent-fg grid place-items-center shadow-card"
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
