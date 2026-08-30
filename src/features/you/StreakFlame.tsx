import { motion } from 'framer-motion';
import { prefersReducedMotion } from '../../theme/motion';

/**
 * A streak flame that actually burns.
 *
 * The static icon read as a number with a picture next to it. The trick is not
 * more movement — PR #9 rightly stripped the home screen's four competing
 * ambient loops — but movement that is *contained*: three copies of the same
 * silhouette, anchored at their base, flickering on durations that never line
 * up. Nothing here changes the element's box, so the card around it stays
 * perfectly still. One thing moves, and it is the thing that should look alive.
 *
 * Colour comes from `currentColor`, so it inherits whatever accent the caller
 * sits in and recolours with the user's theme for free.
 */

/** lucide's `flame`, filled. Reused so the silhouette matches the rest of the app. */
const FLAME = 'M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4';

/** Each layer gets its own rhythm; coprime-ish durations keep the loop hidden. */
const LAYERS = [
  { scale: 1, opacity: 0.4, duration: 1.7, fill: 'currentColor' },
  { scale: 0.74, opacity: 0.85, duration: 2.3, fill: 'currentColor' },
  { scale: 0.44, opacity: 1, duration: 1.1, fill: 'color-mix(in srgb, currentColor 35%, white)' },
] as const;

export function StreakFlame({ size = 24, className }: { size?: number; className?: string }) {
  const still = prefersReducedMotion();

  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'inline-grid', placeItems: 'center', lineHeight: 0 }}
    >
      {/* Ember bed. Deliberately static — the glow gives depth, the flame gives
          life, and animating both was exactly the mistake that got reverted. */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: `-${Math.round(size * 0.35)}px`,
          background:
            'radial-gradient(circle at 50% 65%, color-mix(in srgb, currentColor 28%, transparent), transparent 70%)',
          filter: 'blur(4px)',
          pointerEvents: 'none',
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        style={{ position: 'relative', overflow: 'visible' }}
      >
        {LAYERS.map((layer, i) => (
          <motion.path
            key={i}
            d={FLAME}
            fill={layer.fill}
            fillOpacity={layer.opacity}
            style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
            initial={false}
            animate={
              still
                ? { scaleX: layer.scale, scaleY: layer.scale }
                : {
                    scaleX: [layer.scale, layer.scale * 0.94, layer.scale * 1.03, layer.scale],
                    scaleY: [layer.scale, layer.scale * 1.07, layer.scale * 0.97, layer.scale],
                    rotate: [0, -1.6, 1.1, 0],
                  }
            }
            transition={
              still
                ? { duration: 0 }
                : {
                    duration: layer.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    // Offset so the layers never start together either.
                    delay: i * 0.23,
                  }
            }
          />
        ))}
      </svg>
    </span>
  );
}
