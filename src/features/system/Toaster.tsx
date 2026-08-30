import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, TriangleAlert, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { sfxNotify, sfxPop } from '../../lib/sound';
import { prefersReducedMotion, springPop } from '../../theme/motion';
import { useUI, type Toast } from '../../store/useUI';

const DEFAULT_MS = 2600;

/**
 * App-wide transient messages.
 *
 * Three screens used to hand-roll this, each with its own bottom offset and no
 * way to dismiss one — so they disagreed on screen and nobody could get rid of
 * them. This is the achievement toast's shape (queue, own timer, held back
 * under a cinematic moment) generalised to carry any message.
 */
function ToastRow({ toast }: { toast: Toast }) {
  const dismiss = useUI((s) => s.dismissToast);

  // Each toast owns its timer, keyed on its id so a queue drains one by one.
  // Rows are unmounted entirely while a cinematic moment owns the screen, so
  // this clock cannot start — and therefore cannot run out — underneath one.
  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), toast.duration ?? DEFAULT_MS);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, dismiss]);

  useEffect(() => {
    if (toast.sound === 'pop') sfxPop();
    else if (toast.sound === 'notify') sfxNotify();
  }, [toast.id, toast.sound]);

  const Icon = toast.tone === 'success' ? Check : toast.tone === 'danger' ? TriangleAlert : null;

  return (
    <motion.div
      initial={prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
      transition={springPop}
      className={cn(
        'pointer-events-auto w-full max-w-[420px] flex items-center gap-2.5 rounded-card',
        'bg-elevated/95 backdrop-blur-xl border pl-3.5 pr-1.5 py-2.5 shadow-pop',
        toast.tone === 'success'
          ? 'border-success/40'
          : toast.tone === 'danger'
            ? 'border-danger/40'
            : 'border-border',
      )}
    >
      {Icon && (
        <Icon
          size={16}
          className={cn('shrink-0', toast.tone === 'success' ? 'text-success' : 'text-danger')}
        />
      )}
      <span className="min-w-0 flex-1 text-[14px] font-medium leading-snug">{toast.message}</span>

      {toast.action && (
        <button
          onClick={() => {
            haptics.tap();
            toast.action?.onPress();
            dismiss(toast.id);
          }}
          className="shrink-0 px-2.5 h-8 rounded-btn text-[13px] font-bold text-accent"
        >
          {toast.action.label}
        </button>
      )}

      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="w-8 h-8 grid place-items-center text-fg-subtle shrink-0"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const cinematic = useUI((s) => s.cinematic);
  // AchievementUnlock is a peer at the same offset and tier. When one is up,
  // step over it rather than stacking on top of it.
  const achievementUp = useUI((s) => s.unlockedQueue.length > 0) && !cinematic;

  return (
    // Clears the floating nav. The wrapper ignores pointer events so the screen
    // underneath stays usable while a toast is up.
    <div
      className="fixed inset-x-0 z-[55] flex flex-col items-center gap-2 px-4 pointer-events-none transition-[bottom] duration-300"
      style={{
        bottom: achievementUp ? 152 : 74,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <AnimatePresence initial={false}>
        {!cinematic &&
          toasts.map((t) => <ToastRow key={t.id} toast={t} />)}
      </AnimatePresence>
    </div>
  );
}
