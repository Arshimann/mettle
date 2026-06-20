import { motion } from 'framer-motion';

const COLORS = ['var(--accent)', '#ff5a5f', '#2dd4a7', '#f5b545', '#7c6cff'];

// Generated once at module load (outside render) so the component stays pure.
const PIECES = Array.from({ length: 34 }, (_, i) => ({
  id: i,
  x: (Math.random() * 2 - 1) * 200,
  y: 200 + Math.random() * 260,
  rot: Math.random() * 540,
  delay: Math.random() * 0.15,
  dur: 1.1 + Math.random() * 0.7,
  color: COLORS[i % COLORS.length],
  size: 6 + Math.random() * 7,
}));

/** Lightweight confetti burst (no dependency). Renders inside a relative parent. */
export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PIECES.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rot }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '38%',
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
