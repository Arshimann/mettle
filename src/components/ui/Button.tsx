import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/cn';
import { tapScale } from '../../theme/motion';
import { haptics } from '../../lib/haptics';

type Variant = 'accent' | 'surface' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  accent: 'bg-accent text-accent-fg shadow-card',
  surface: 'bg-surface-2 text-fg border border-border',
  outline: 'bg-transparent text-fg border border-border-strong',
  ghost: 'bg-transparent text-fg-muted',
  danger: 'bg-transparent text-danger border border-border',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-btn',
  md: 'h-11 px-4 text-sm gap-2 rounded-btn',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-card',
};

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = 'surface',
  size = 'md',
  fullWidth,
  className,
  onClick,
  children,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileTap={tapScale}
      onClick={(e) => {
        haptics.tap();
        onClick?.(e);
      }}
      className={cn(
        'inline-flex items-center justify-center font-semibold select-none transition-colors',
        'disabled:opacity-40 disabled:pointer-events-none',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
