import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/**
 * Animated number that counts up on mount. Renders the value instantly when
 * reduced-motion is on or the tab is hidden (so it's never stuck at 0).
 */
export function CountUp({
  value,
  className,
  duration = 0.8,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const instant = !!reduce || (typeof document !== 'undefined' && document.visibilityState === 'hidden');
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (instant) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, instant, duration]);

  return <span className={className}>{(instant ? value : display).toLocaleString()}</span>;
}
