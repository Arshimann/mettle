import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '../../lib/cn';
import { FIGURE_LOOP, figureFrames, type FigureKind } from './figures';

export type { FigureKind } from './figures';

/**
 * The stretch figure, v2: a curved 13-joint body (spine that rounds and
 * arches, limbs with organic elbow/knee bends, weighted torso stroke) that
 * gently loops between the deep stretch and a breathe-out keyframe.
 * Pure SVG, themeable via currentColor, static under prefers-reduced-motion.
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
  const [a, b] = useMemo(() => figureFrames(kind), [kind]);
  const move = animated && !reduce;

  const seg = (
    key: string,
    dA: string,
    dB: string,
    width: number,
  ) =>
    move ? (
      <motion.path
        key={key}
        initial={{ d: dA }}
        animate={{ d: dB }}
        transition={FIGURE_LOOP}
        strokeWidth={width}
        fill="none"
      />
    ) : (
      <path key={key} d={dB} strokeWidth={width} fill="none" />
    );

  return (
    <svg
      viewBox="0 0 120 120"
      className={cn('w-full h-full', className)}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      aria-hidden="true"
    >
      {/* legs under torso, arms over — reads like a body, not a wireframe */}
      {seg('legL', a.legL, b.legL, 6)}
      {seg('legR', a.legR, b.legR, 6)}
      {seg('spine', a.spine, b.spine, 7.5)}
      {seg('armL', a.armL, b.armL, 5.5)}
      {seg('armR', a.armR, b.armR, 5.5)}
      {/* neck + head */}
      {move ? (
        <>
          <motion.line
            initial={{ x1: a.neck[0], y1: a.neck[1], x2: a.head[0], y2: a.head[1] }}
            animate={{ x1: b.neck[0], y1: b.neck[1], x2: b.head[0], y2: b.head[1] }}
            transition={FIGURE_LOOP}
            strokeWidth={5}
          />
          <motion.circle
            r={7.5}
            fill="currentColor"
            stroke="none"
            initial={{ cx: a.head[0], cy: a.head[1] }}
            animate={{ cx: b.head[0], cy: b.head[1] }}
            transition={FIGURE_LOOP}
          />
        </>
      ) : (
        <>
          <line x1={b.neck[0]} y1={b.neck[1]} x2={b.head[0]} y2={b.head[1]} strokeWidth={5} />
          <circle r={7.5} fill="currentColor" stroke="none" cx={b.head[0]} cy={b.head[1]} />
        </>
      )}
    </svg>
  );
}
