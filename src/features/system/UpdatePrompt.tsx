import { useRegisterSW } from 'virtual:pwa-register/react';
import { RotateCw, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { springPop } from '../../theme/motion';
import { haptics } from '../../lib/haptics';

/**
 * Shows a small pill when a new service worker is waiting, so users get the
 * latest deploy on demand instead of only on a cold relaunch. The reload it
 * triggers is also what surfaces the "What's new" notes for the new version.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-[74px] z-[55] flex justify-center px-4 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPop}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-fg text-canvas pl-4 pr-1.5 py-1.5 shadow-pop"
      >
        <span className="text-[13px] font-semibold">New version ready</span>
        <button
          onClick={() => { haptics.tap(); updateServiceWorker(true); }}
          className="flex items-center gap-1.5 rounded-full bg-accent text-accent-fg text-[13px] font-semibold px-3 h-8"
        >
          <RotateCw size={14} /> Reload
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          aria-label="Dismiss update"
          className="w-8 h-8 grid place-items-center text-canvas/60"
        >
          <X size={16} />
        </button>
      </motion.div>
    </div>
  );
}
