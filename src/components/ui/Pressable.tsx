import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/cn';
import { springPop } from '../../theme/motion';

/**
 * Interactive surface that responds to touch with a settle and a bloom of
 * accent light, rather than a hard scale jolt. The glow is what makes a press
 * feel alive — a bold/scale-only response reads as mechanical.
 *
 * Reduced-motion is handled globally by MotionConfig in ThemeProvider, which
 * strips the transforms; the colour transition is harmless either way.
 */
export function Pressable({
  children,
  className,
  glow = true,
  scale = 0.97,
  ...rest
}: HTMLMotionProps<'button'> & {
  /** Set false for surfaces where a halo would be noise (dense list rows). */
  glow?: boolean;
  scale?: number;
}) {
  return (
    <motion.button
      whileTap={{
        scale,
        boxShadow: glow ? 'var(--accent-glow)' : undefined,
      }}
      transition={springPop}
      className={cn('relative outline-none', className)}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

/** Non-button variant, for cards that already contain their own controls. */
export function PressableCard({
  children,
  className,
  scale = 0.985,
  ...rest
}: HTMLMotionProps<'div'> & { scale?: number }) {
  return (
    <motion.div
      whileTap={{ scale, boxShadow: 'var(--accent-glow)' }}
      transition={springPop}
      className={cn('relative', className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
