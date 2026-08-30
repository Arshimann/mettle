import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { sfxWoosh } from '../../lib/sound';
import { easeOut } from '../../theme/motion';
import { useUI } from '../../store/useUI';
import { useStore, type EndSessionResult } from '../../store/useStore';
import { sessionVolume } from '../../lib/formulas';
import { fromKg, unitLabel } from '../../lib/units';

/**
 * Posting a workout to the board used to be completely invisible: a
 * fire-and-forget call between the finish sheet closing and the celebration
 * opening. The most social thing the app does happened with no acknowledgement
 * at all.
 *
 * So it gets a moment. The summary crumples, folds into a paper plane, and is
 * thrown — the plane accelerating *away* on an ease-in curve, because that is
 * what being thrown looks like. It only plays when the workout is actually
 * published; a private session should never perform a send.
 */

const TOTAL_MS = 1500;

export function SendOff({ result, onDone }: { result: EndSessionResult; onDone: () => void }) {
  const units = useStore((s) => s.settings.units);
  // Held in a ref so the timer is armed exactly once — Train re-renders on its
  // own clock, and depending on the callback would keep resetting it.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    useUI.getState().setCinematic(true);
    const t = setTimeout(() => done.current(), TOTAL_MS);
    return () => {
      clearTimeout(t);
      useUI.getState().setCinematic(false);
    };
  }, []);

  // The sound belongs to the crumple, so the throw rides its tail.
  useEffect(() => {
    const t = setTimeout(() => sfxWoosh(), 380);
    return () => clearTimeout(t);
  }, []);

  const sets = result.entry.exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const vol = Math.round(fromKg(sessionVolume(result.entry.exercises), units));

  const stat = (value: string | number, label: string) => (
    <div className="text-center">
      <div className="text-[22px] font-display font-bold tabular leading-none">{value}</div>
      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-fg-subtle mt-1">{label}</div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] bg-canvas grid place-items-center px-8 overflow-hidden"
    >
      <div className="relative w-full max-w-[300px] aspect-[4/3] grid place-items-center">
        {/* The sheet: the summary, on paper, tilted just off square. */}
        <motion.div
          initial={{ scaleX: 1, scaleY: 1, rotate: -2, opacity: 1 }}
          animate={{
            scaleX: [1, 0.86, 0.28],
            scaleY: [1, 0.94, 0.34],
            rotate: [-2, 4, -8],
            skewX: [0, -6, 3],
            filter: ['blur(0px)', 'blur(0.5px)', 'blur(1.5px)'],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.5, delay: 0.4, times: [0, 0.45, 1], ease: easeOut }}
          className="absolute inset-x-0 rounded-card bg-surface border border-border shadow-pop p-4"
          style={{ backgroundImage: 'var(--sheen)' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-subtle mb-1">
            Posted
          </div>
          <div className="text-[17px] font-semibold truncate mb-3">{result.entry.dayName || 'Session'}</div>
          <div className="flex items-center justify-between">
            {stat(result.entry.exercises.length, 'Exercises')}
            {stat(sets, 'Sets')}
            {stat(vol.toLocaleString(), `${unitLabel(units)} vol`)}
          </div>
          {result.prHits.length > 0 && (
            <div className="mt-3 text-[11px] font-semibold text-accent truncate">
              PR · {result.prHits.join(', ')}
            </div>
          )}
        </motion.div>

        {/* The plane. Drawn rather than borrowed: lucide's Send is an outline,
            and this needs two faces so it reads as folded paper. */}
        <motion.svg
          width="52"
          height="52"
          viewBox="0 0 24 24"
          className="absolute"
          initial={{ opacity: 0, scale: 0.9, x: 0, y: 0, rotate: -8 }}
          animate={{
            opacity: [0, 1, 1, 1],
            x: [0, 0, 40, 130],
            y: [0, 0, -140, -900],
            rotate: [-8, -8, 12, 30],
            scale: [0.9, 1, 0.9, 0.42],
          }}
          transition={{
            duration: 0.95,
            delay: 0.55,
            times: [0, 0.18, 0.45, 1],
            ease: [0.32, 0, 0.67, 0],
          }}
        >
          {/* underside, then the lit top face */}
          <path d="M2 12 L22 3 L13 21 L11 13 Z" fill="color-mix(in srgb, var(--accent) 62%, black)" />
          <path d="M2 12 L22 3 L11 13 Z" fill="var(--accent)" />
        </motion.svg>

        {/* A short accent streak left behind the throw. */}
        <motion.div
          className="absolute w-[3px] rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(to top, transparent, var(--accent))',
            transformOrigin: 'bottom center',
          }}
          initial={{ opacity: 0, height: 0, x: 0, y: 0, rotate: 16 }}
          animate={{ opacity: [0, 0.5, 0], height: [0, 120, 180], x: [0, 60, 120], y: [0, -120, -300] }}
          transition={{ duration: 0.8, delay: 0.62, ease: [0.32, 0, 0.67, 0] }}
        />
      </div>
    </motion.div>
  );
}
