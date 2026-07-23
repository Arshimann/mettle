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

/** Press feedback for tappable surfaces — firm enough to feel. */
export const tapScale = { scale: 0.95 };
