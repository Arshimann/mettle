import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Directional page transition wrapper used inside AnimatePresence. */
export function Screen({ children, dir }: { children: ReactNode; dir: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: dir * 26, scale: 0.985 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
