import type { Transition, Variants } from 'framer-motion';

// Shared spring presets — premium, fast, slightly springy.
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 };
export const springPop: Transition = { type: 'spring', stiffness: 500, damping: 24 };
export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Slow, weighty easing for hero moments (celebration, screen reveals). */
export const cinematic: Transition = { duration: 0.65, ease: [0.16, 1, 0.3, 1] };

/** Staggered list/card entrance. */
export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOut } },
};

/** Screen-level hero entrance — slower, deeper stagger than listContainer. */
export const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const heroItem: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: cinematic },
};

/** Blur-in reveal for celebration beats (PR names, quotes). */
export const revealBlur: Variants = {
  hidden: { opacity: 0, filter: 'blur(8px)', y: 10 },
  show: { opacity: 1, filter: 'blur(0px)', y: 0, transition: cinematic },
};

/**
 * Press feedback. The settle is only half of it — the bloom of accent light is
 * what makes a press feel alive rather than mechanical.
 */
export const tapScale = { scale: 0.95, boxShadow: 'var(--accent-glow)' };

/** Same idea at card scale, where a 0.95 squeeze would look broken. */
export const tapCard = { scale: 0.985, boxShadow: 'var(--accent-glow)' };

/**
 * Slow ambient pulse for surfaces that should look alive at rest — the streak
 * card, the next-workout prompt. Deliberately long and low-contrast: it should
 * register at the edge of vision, never demand attention.
 */
export const ambientGlow = {
  animate: {
    opacity: [0.45, 0.85, 0.45],
    scale: [1, 1.04, 1],
  },
  transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const },
};

/** A single bright beat when something lands — a set ticked, a badge earned. */
export const pulseOnce = {
  initial: { boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
  animate: {
    boxShadow: [
      '0 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent)',
      '0 0 0 14px rgba(0,0,0,0)',
    ],
  },
  transition: { duration: 0.6, ease: easeOut },
};

/**
 * True when the OS asks for less motion.
 *
 * Read at render rather than subscribed to: the setting effectively never
 * changes mid-session, and a listener on every animated surface costs more than
 * it buys. Reduced motion must still let the *outcome* happen — the toast
 * appears, the workout posts, the flame shows — it just arrives without travel.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
