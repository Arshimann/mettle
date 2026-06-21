import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, Pause, Play, SkipForward, X } from 'lucide-react';
import { Button } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { playChime } from '../../lib/sound';
import { useUI } from '../../store/useUI';
import { holdSeconds, type StretchCategory } from '../../data/stretches';

const RADIUS = 88;
const CIRC = 2 * Math.PI * RADIUS;

export function RoutinePlayer({ category, onClose }: { category: StretchCategory; onClose: () => void }) {
  const pushOverlay = useUI((s) => s.pushOverlay);
  const popOverlay = useUI((s) => s.popOverlay);
  const stretches = category.stretches;

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
      <div className="flex items-center justify-between px-5 h-14 shrink-0">
        <div className="font-semibold truncate">{category.name}</div>
        <button onClick={onClose} aria-label="Close routine" className="w-9 h-9 grid place-items-center rounded-full bg-surface-2 text-fg-muted">
          <X size={18} />
        </button>
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
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            {/* progress dots */}
            <div className="flex items-center gap-1.5 mb-8">
              {stretches.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-accent' : i < idx ? 'w-1.5 bg-accent' : 'w-1.5 bg-border-strong'}`}
                />
              ))}
            </div>

            <div className="relative grid place-items-center mb-6">
              <svg width={208} height={208} viewBox="0 0 208 208" className="-rotate-90">
                <circle cx="104" cy="104" r={RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                <motion.circle
                  cx="104"
                  cy="104"
                  r={RADIUS}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  animate={{ strokeDashoffset: CIRC * (1 - progress) }}
                  transition={{ duration: 0.9, ease: 'linear' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-bold tabular leading-none">{remaining}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-subtle mt-1.5">seconds</span>
              </div>
            </div>

            <h1 className="text-2xl mb-1 leading-tight">{cur.name}</h1>
            <div className="text-[11px] uppercase tracking-wider text-accent font-semibold mb-3">{cur.target} · {cur.hold}</div>
            <p className="text-sm text-fg-muted leading-relaxed max-w-[22rem]">{cur.steps}</p>
          </div>

          <div className="shrink-0 px-8 pb-8 flex items-center justify-center gap-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)' }}>
            <button
              onClick={() => { haptics.tap(); advance(idx - 1); }}
              disabled={idx === 0}
              aria-label="Previous stretch"
              className="w-12 h-12 grid place-items-center rounded-full bg-surface-2 text-fg disabled:opacity-30"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => { haptics.tap(); setRunning((r) => !r); }}
              aria-label={running ? 'Pause' : 'Resume'}
              className="w-16 h-16 grid place-items-center rounded-full bg-accent text-accent-fg shadow-pop"
            >
              {running ? <Pause size={26} fill="currentColor" strokeWidth={0} /> : <Play size={26} fill="currentColor" strokeWidth={0} />}
            </button>
            <button
              onClick={() => { haptics.tap(); advance(idx + 1); }}
              aria-label="Next stretch"
              className="w-12 h-12 grid place-items-center rounded-full bg-surface-2 text-fg"
            >
              <SkipForward size={22} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
