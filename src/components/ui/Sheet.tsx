import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { spring } from '../../theme/motion';

/**
 * Bottom sheet. Mounts on `open`, unmounts on close (entrance-only animation —
 * robust against backgrounded-tab animation stalls). Backdrop click closes.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={spring}
        className="relative bg-elevated border-t border-border rounded-t-[26px] max-h-[88vh] flex flex-col shadow-pop"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="shrink-0 pt-2.5 flex justify-center">
          <div className="w-9 h-1 rounded-full bg-border-strong" />
        </div>
        <div className="shrink-0 flex items-center justify-between px-5 pt-2 pb-3">
          <h2 className="text-xl">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 grid place-items-center rounded-full bg-surface-2 text-fg-muted"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto no-scrollbar px-5 pb-6">{children}</div>
      </motion.div>
    </div>
  );
}
