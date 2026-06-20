import { motion } from 'framer-motion';
import { cn } from '../lib/cn';
import { spring } from '../theme/motion';
import { haptics } from '../lib/haptics';
import { useUI } from '../store/useUI';
import { NAV } from './nav';

export function BottomNav() {
  const screen = useUI((s) => s.screen);
  const navigate = useUI((s) => s.navigate);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/85 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-[640px] mx-auto flex items-stretch h-[60px]">
        {NAV.map((item) => {
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
              className="relative flex-1 flex flex-col items-center justify-center gap-1 outline-none"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  transition={spring}
                  className="absolute top-0 h-[3px] w-7 rounded-full bg-accent"
                />
              )}
              <motion.span animate={{ scale: active ? 1.06 : 1, y: active ? -1 : 0 }} transition={spring}>
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? 'text-accent' : 'text-fg-subtle'}
                />
              </motion.span>
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-tight whitespace-nowrap',
                  active ? 'text-fg' : 'text-fg-subtle',
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
