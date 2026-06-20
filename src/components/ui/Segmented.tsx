import { useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { spring } from '../../theme/motion';
import { haptics } from '../../lib/haptics';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  fullWidth?: boolean;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  fullWidth,
}: SegmentedProps<T>) {
  const id = useId();
  return (
    <div
      className={cn(
        'inline-flex p-1 gap-1 bg-surface-2 border border-border rounded-btn',
        fullWidth && 'flex w-full',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => {
              if (!active) {
                haptics.select();
                onChange(o.value);
              }
            }}
            className={cn(
              'relative h-9 px-3.5 text-[13px] font-semibold rounded-[calc(var(--radius-sm)-3px)] transition-colors',
              fullWidth && 'flex-1',
              active ? 'text-accent-fg' : 'text-fg-muted',
            )}
          >
            {active && (
              <motion.span
                layoutId={id}
                transition={spring}
                className="absolute inset-0 bg-accent rounded-[inherit]"
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
