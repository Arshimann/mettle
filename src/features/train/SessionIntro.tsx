import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { sfxSessionStart } from '../../lib/sound';

/**
 * The beat between tapping Start and the logger appearing. Starting a workout
 * is the most significant thing you do in the app, so it gets a moment rather
 * than a flat screen swap — the name pushes toward you out of an accent bloom,
 * then hands off.
 */
export function SessionIntro({ dayName, onDone }: { dayName: string; onDone: () => void }) {
  // Kept in a ref so the timer is armed exactly once. Depending on `onDone`
  // directly would re-arm it on every parent render — and Train re-renders
  // every second from its elapsed-time tick, so the intro would never end.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    sfxSessionStart();
    const t = setTimeout(() => done.current(), 1150);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[75] bg-canvas grid place-items-center px-8 text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 1], scale: [0.6, 1.06, 1] }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], times: [0, 0.55, 1] }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 45% at 50% 50%, var(--accent-soft), transparent 65%)' }}
      />

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="w-16 h-16 rounded-[20px] bg-accent bg-accent-grad text-accent-fg grid place-items-center mb-5"
          style={{ boxShadow: 'var(--accent-glow)' }}
        >
          <Dumbbell size={30} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-[13px] font-semibold uppercase tracking-[0.18em] text-accent mb-1.5"
        >
          Let's go
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ delay: 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="display-hero"
        >
          {dayName}
        </motion.h1>
      </div>
    </motion.div>
  );
}
