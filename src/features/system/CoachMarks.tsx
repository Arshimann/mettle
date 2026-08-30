import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { prefersReducedMotion, springPop } from '../../theme/motion';
import { useUI } from '../../store/useUI';
import type { CoachStep } from '../../data/tours';

/**
 * A spotlight that points at the real screen underneath it.
 *
 * The dim is four panels around the target rather than an SVG mask, and that is
 * load-bearing: the panels swallow taps while the gap between them does not, so
 * the thing being pointed at stays pressable. A tutorial you can only watch is
 * a slideshow.
 *
 * Rendered through a portal at z-[65] — above sheets, so a mark can point
 * inside one, but below the finish celebration, which owns the screen outright.
 */

const PAD = 6;

export function CoachMarks({ steps, onDone }: { steps: CoachStep[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[i];

  const pushOverlay = useUI((s) => s.pushOverlay);
  const popOverlay = useUI((s) => s.popOverlay);
  useEffect(() => {
    pushOverlay();
    return () => popOverlay();
  }, [pushOverlay, popOverlay]);

  const measure = useCallback(() => {
    const el = step ? document.querySelector(step.target) : null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  // Everything that sets state runs from a callback — a timer, a listener —
  // never synchronously in the effect body.
  useEffect(() => {
    if (!step) return;
    step.before?.();
    const settle = setTimeout(() => {
      const el = document.querySelector(step.target);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      // Measure after the scroll lands, or the cut-out sits where the element
      // used to be.
      setTimeout(measure, 300);
    }, 140);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(settle);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, measure]);

  const finish = useCallback(() => {
    haptics.tap();
    onDone();
  }, [onDone]);

  const next = useCallback(() => {
    haptics.select();
    if (i >= steps.length - 1) onDone();
    else setI((n) => n + 1);
  }, [i, steps.length, onDone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'Enter' || e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish, next]);

  if (typeof document === 'undefined' || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // With no rect we still teach — the panel just centres instead of pointing.
  const hole = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;
  const below = hole ? hole.top + hole.height / 2 < vh / 2 : true;
  // pointer-events-auto on the panels only: the gap between them is the
  // whole point, so the element being pointed at stays pressable.
  const dim = 'absolute bg-black/72 pointer-events-auto';

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="coach"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion() ? 0 : 0.22 }}
        className="fixed inset-0 z-[65] pointer-events-none"
      >
        {hole ? (
          <>
            <div className={dim} style={{ top: 0, left: 0, width: vw, height: Math.max(0, hole.top) } as const} />
            <div className={dim} style={{ top: hole.top + hole.height, left: 0, width: vw, height: Math.max(0, vh - hole.top - hole.height) }} />
            <div className={dim} style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
            <div className={dim} style={{ top: hole.top, left: hole.left + hole.width, width: Math.max(0, vw - hole.left - hole.width), height: hole.height }} />
            <div
              className="absolute rounded-btn pointer-events-none"
              style={{
                top: hole.top,
                left: hole.left,
                width: hole.width,
                height: hole.height,
                boxShadow: '0 0 0 2px var(--accent), var(--accent-glow)',
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-black/72 pointer-events-auto" />
        )}

        <motion.div
          key={step.id}
          initial={prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, y: below ? 10 : -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={springPop}
          className="pointer-events-auto absolute left-1/2 -translate-x-1/2 w-[min(22rem,calc(100vw-2rem))] rounded-card bg-elevated border border-border shadow-pop p-4"
          style={
            hole
              ? below
                ? { top: Math.min(vh - 190, hole.top + hole.height + 14) }
                : { top: Math.max(16, hole.top - 176) }
              : { top: vh / 2 - 88 }
          }
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent mb-1.5">
            {i + 1} of {steps.length}
          </div>
          <h3 className="text-[17px] font-semibold leading-snug mb-1">{step.title}</h3>
          <p className="text-[14px] text-fg-muted leading-relaxed">{step.body}</p>
          <div className="flex items-center gap-2.5 mt-3.5">
            <button onClick={finish} className="text-[13px] font-semibold text-fg-subtle px-1">
              Skip
            </button>
            <Button variant="accent" fullWidth onClick={next}>
              {i >= steps.length - 1 ? 'Done' : 'Next'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
