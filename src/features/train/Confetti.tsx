import { motion, useReducedMotion } from 'framer-motion';

// Accent-gradient family first, with two warm sparks for contrast.
const COLORS = ['#7c5cff', '#4f8bff', 'var(--accent)', '#2dd4a7', '#f5b545'];

interface Piece {
  id: string;
  ox: number; // burst origin (% of container)
  oy: number;
  x: number; // travel
  y: number;
  rot: number;
  delay: number;
  dur: number;
  color: string;
  size: number;
  round: boolean;
}

/** A firework: pieces radiating out from one origin point. */
function burst(cx: number, cy: number, count: number, delay: number, spread: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const dist = spread * (0.55 + Math.random() * 0.45);
    return {
      id: `${cx}-${cy}-${i}`,
      ox: cx,
      oy: cy,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist + 60 + Math.random() * 90, // gravity pulls the tail down
      rot: Math.random() * 720 - 360,
      delay: delay + Math.random() * 0.12,
      dur: 1.1 + Math.random() * 0.8,
      color: COLORS[i % COLORS.length],
      size: 5 + Math.random() * 7,
      round: Math.random() > 0.6,
    };
  });
}

// Generated once at module load (outside render) so the component stays pure.
const STANDARD = [...burst(50, 34, 26, 0, 190), ...burst(28, 22, 14, 0.35, 140), ...burst(74, 24, 14, 0.55, 140)];
const BIG = [...STANDARD, ...burst(50, 18, 20, 0.8, 210), ...burst(38, 40, 12, 1.0, 120), ...burst(64, 38, 12, 1.15, 120)];

/** Multi-burst fireworks (no dependency). Renders inside a relative parent.
 *  `big` stacks extra bursts — used when a PR lands. */
export function Confetti({ big = false }: { big?: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) return null; // celebration text carries the moment instead

  const pieces = big ? BIG : STANDARD;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 1, 0], x: p.x, y: p.y, rotate: p.rot, scale: 1 }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: `${p.ox}%`,
            top: `${p.oy}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? 999 : 2,
          }}
        />
      ))}
    </div>
  );
}
