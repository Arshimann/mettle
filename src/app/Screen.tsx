import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { easeOut } from '../theme/motion';

/** Directional page transition wrapper used inside AnimatePresence. */
export function Screen({ children, dir }: { children: ReactNode; dir: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: dir * 26 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
