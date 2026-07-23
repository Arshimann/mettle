import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { spring } from '../theme/motion';
import { haptics } from '../lib/haptics';
import { useUI } from '../store/useUI';
import { useStore } from '../store/useStore';
import { visibleNav } from './nav';

export function BottomNav() {
  const screen = useUI((s) => s.screen);
  const navigate = useUI((s) => s.navigate);
  const tabs = useStore((s) => s.settings.tabs);

  const items = visibleNav(tabs);
  // Drop labels once the bar gets crowded so 7 tabs still fit cleanly.
  const iconOnly = items.length > 6;

  return (
    <nav
      className="fixed z-40 inset-x-4 mx-auto max-w-[560px] rounded-full border border-border bg-surface/80 backdrop-blur-2xl shadow-float"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="flex items-stretch h-[62px] px-1.5">
        {items.map((item) => {
          const active = screen === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (!active) {
                  haptics.select();
                  navigate(item.id);
                }
              }}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 outline-none"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  transition={spring}
                  className="absolute inset-x-1 inset-y-1.5 rounded-full bg-accent-soft"
                  style={{ boxShadow: 'var(--accent-glow)' }}
                />
              )}
              <motion.span
                className="relative z-10"
                animate={{ scale: active ? 1.06 : 1, y: active ? -1 : 0 }}
                whileTap={{ scale: 0.82 }}
                transition={spring}
              >
                <Icon
                  size={iconOnly ? 24 : 22}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? 'text-accent' : 'text-fg-subtle'}
                />
              </motion.span>
              {!iconOnly && (
                <span
                  className={cn(
                    'relative z-10 text-[10px] font-semibold tracking-tight whitespace-nowrap',
                    active ? 'text-fg' : 'text-fg-subtle',
                  )}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
