import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { Button } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { playChime } from '../../lib/sound';
import { useUI } from '../../store/useUI';
import { holdSeconds, type PlayableRoutine } from '../../data/stretches';
import { StretchFigure } from './StretchFigure';

const SIZE = 272;
const RADIUS = 128;
const CIRC = 2 * Math.PI * RADIUS;

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function RoutinePlayer({ routine, onClose }: { routine: PlayableRoutine; onClose: () => void }) {
  const pushOverlay = useUI((s) => s.pushOverlay);
  const popOverlay = useUI((s) => s.popOverlay);
  const stretches = routine.stretches;

  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(() => holdSeconds(stretches[0].hold));
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);

  // Keep tab-swipe suppressed while the player owns the screen.
  useEffect(() => {
    pushOverlay();
    return () => popOverlay();
  }, [pushOverlay, popOverlay]);

  const advance = (next: number) => {
    if (next >= stretches.length) {
      setDone(true);
      setRunning(false);
      haptics.success();
      return;
    }
    if (next < 0) return;
    setIdx(next);
    setRemaining(holdSeconds(stretches[next].hold));
  };

  // Count down while running; when a hold finishes, chime and roll to the next.
  useEffect(() => {
    if (!running || done) return;
    const id = setTimeout(() => {
      if (remaining > 1) {
        setRemaining(remaining - 1);
        return;
      }
      playChime();
      haptics.success();
      const next = idx + 1;
      if (next >= stretches.length) {
        setDone(true);
        setRunning(false);
      } else {
        setIdx(next);
        setRemaining(holdSeconds(stretches[next].hold));
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [running, done, remaining, idx, stretches]);

  const cur = stretches[idx];
  const total = holdSeconds(cur.hold);
  const progress = total > 0 ? (total - remaining) / total : 0;

  return (
    <div className="fixed inset-0 z-[70] bg-canvas flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* X · counter · spacer — matches the reference layout */}
      <div className="grid grid-cols-3 items-center px-5 h-14 shrink-0">
        <button
          onClick={onClose}
          aria-label="Close routine"
          className="w-9 h-9 grid place-items-center rounded-full bg-surface-2 text-fg-muted justify-self-start"
        >
          <X size={18} />
        </button>
        <div className="justify-self-center text-[15px] font-semibold tabular">
          {idx + 1} / {stretches.length}
        </div>
        <div />
      </div>

      {done ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className="w-20 h-20 rounded-[24px] bg-accent text-accent-fg grid place-items-center mb-6 shadow-pop"
          >
            <Check size={40} strokeWidth={3} />
          </motion.div>
          <h1 className="text-3xl mb-2">Routine complete</h1>
          <p className="text-fg-muted mb-8">{stretches.length} stretches · nice work.</p>
          <Button variant="accent" size="lg" className="px-8" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center min-h-0">
            {/* figure hero on a soft disc inside the progress ring */}
            <div className="relative grid place-items-center">
              <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
                <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
                <motion.circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  animate={{ strokeDashoffset: CIRC * (1 - progress) }}
                  transition={{ duration: 0.9, ease: 'linear' }}
                />
                <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS - 16} fill="var(--accent-soft)" />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <StretchFigure key={cur.illustration} kind={cur.illustration} className="w-44 h-44 text-accent" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mt-7 leading-tight">{cur.name}</h1>
            <div className="text-[52px] font-bold tabular leading-none text-fg-muted mt-3">{fmtTime(remaining)}</div>
            <p className="text-sm text-fg-muted leading-relaxed max-w-[22rem] mt-4 line-clamp-3">{cur.steps}</p>
          </div>

          <div className="shrink-0 px-8 flex items-center justify-center gap-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)' }}>
            <button
              onClick={() => { haptics.tap(); advance(idx - 1); }}
              disabled={idx === 0}
              aria-label="Previous stretch"
              className="w-14 h-14 grid place-items-center rounded-full bg-surface-2 text-fg disabled:opacity-30"
            >
              <SkipBack size={22} fill="currentColor" strokeWidth={0} />
            </button>
            <button
              onClick={() => { haptics.tap(); setRunning((r) => !r); }}
              aria-label={running ? 'Pause' : 'Resume'}
              className="w-[72px] h-[72px] grid place-items-center rounded-full bg-accent text-accent-fg shadow-pop"
            >
              {running ? <Pause size={28} fill="currentColor" strokeWidth={0} /> : <Play size={28} fill="currentColor" strokeWidth={0} />}
            </button>
            <button
              onClick={() => { haptics.tap(); advance(idx + 1); }}
              aria-label="Next stretch"
              className="w-14 h-14 grid place-items-center rounded-full bg-surface-2 text-fg"
            >
              <SkipForward size={22} fill="currentColor" strokeWidth={0} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
