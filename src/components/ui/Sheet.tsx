import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { spring } from '../../theme/motion';
import { useUI } from '../../store/useUI';

/**
 * Bottom sheet with slide-in/out. Backdrop click closes.
 *
 * Rendered through a portal to <body>, and that is load-bearing: `filter`,
 * `backdrop-filter` and `transform` all create a containing block for
 * `position: fixed` descendants. The app header uses `backdrop-blur-xl`, so a
 * sheet opened from inside it (the notification bell) had its full-screen
 * backdrop clamped to the 56px header — covering the header, swallowing every
 * tap on it, and dropping the panel at the wrong place. The portal moves the
 * sheet out of any such ancestor for good.
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
  // Register as an open overlay so swipe-between-tabs is suppressed while up.
  const pushOverlay = useUI((s) => s.pushOverlay);
  const popOverlay = useUI((s) => s.popOverlay);
  useEffect(() => {
    if (!open) return;
    pushOverlay();
    return () => popOverlay();
  }, [open, pushOverlay, popOverlay]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && [
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        />,
        <motion.div
          key="panel"
          className="fixed bottom-0 inset-x-0 z-[60] max-w-[640px] mx-auto bg-elevated/95 backdrop-blur-xl border-t border-border rounded-t-[28px] max-h-[88vh] flex flex-col shadow-pop"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={spring}
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
        </motion.div>,
      ]}
    </AnimatePresence>,
    document.body,
  );
}
