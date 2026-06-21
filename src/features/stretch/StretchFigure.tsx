import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { BONES, FIGURE_LOOP, POSES, type FigureKind } from './figures';

export type { FigureKind } from './figures';

/**
 * A minimal stick-figure that gently loops a stretch between a relaxed and a
 * deepened pose. Pure SVG (no asset bundle), themeable via `currentColor`, and
 * static when the user prefers reduced motion.
 */
export function StretchFigure({
  kind,
  animated = true,
  className,
}: {
  kind: FigureKind;
  animated?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [a, b] = POSES[kind] ?? POSES.stand;
  const move = animated && !reduce;

  return (
    <svg
      viewBox="0 0 120 120"
      className={cn('w-full h-full', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {BONES.map(([p, q], i) =>
        move ? (
          <motion.line
            key={i}
            initial={{ x1: a[p][0], y1: a[p][1], x2: a[q][0], y2: a[q][1] }}
            animate={{ x1: b[p][0], y1: b[p][1], x2: b[q][0], y2: b[q][1] }}
            transition={FIGURE_LOOP}
          />
        ) : (
          <line key={i} x1={b[p][0]} y1={b[p][1]} x2={b[q][0]} y2={b[q][1]} />
        ),
      )}
      {move ? (
        <motion.circle
          r={8.5}
          fill="currentColor"
          stroke="none"
          initial={{ cx: a.head[0], cy: a.head[1] }}
          animate={{ cx: b.head[0], cy: b.head[1] }}
          transition={FIGURE_LOOP}
        />
      ) : (
        <circle r={8.5} fill="currentColor" stroke="none" cx={b.head[0]} cy={b.head[1]} />
      )}
    </svg>
  );
}
