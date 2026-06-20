import type { Transition, Variants } from 'framer-motion';

// Shared spring presets — premium, fast, slightly springy.
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 };
export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 30 };
export const springPop: Transition = { type: 'spring', stiffness: 500, damping: 24 };
export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Staggered list/card entrance. */
export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOut } },
};

/** Press feedback for tappable surfaces. */
export const tapScale = { scale: 0.97 };
