import { useEffect, useRef, useState } from 'react';
import { Flag, Pause, Play, RotateCcw } from 'lucide-react';
import { Button, Card, CardLabel } from '../../components/ui';
import { haptics } from '../../lib/haptics';

function fmt(ms: number): string {
  const cs = Math.floor((ms % 1000) / 10);
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function Stopwatch() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);
  const accRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      setMs(accRef.current + (performance.now() - startRef.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const start = () => {
    haptics.tap();
    startRef.current = performance.now();
    setRunning(true);
  };
  const stop = () => {
    haptics.tap();
    accRef.current += performance.now() - startRef.current;
    setMs(accRef.current);
    setRunning(false);
  };
  const reset = () => {
    haptics.tap();
    accRef.current = 0;
    setMs(0);
    setLaps([]);
    setRunning(false);
  };
  const lap = () => {
    haptics.tap();
    setLaps((l) => [ms, ...l]);
  };

  return (
    <Card>
      <CardLabel>Stopwatch</CardLabel>
      <div className="text-center text-5xl font-bold tabular my-3 tracking-tight">{fmt(ms)}</div>
      <div className="grid grid-cols-3 gap-2.5">
        <Button variant={running ? 'surface' : 'accent'} onClick={running ? stop : start}>
          {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start</>}
        </Button>
        <Button variant="surface" onClick={lap} disabled={!running}>
          <Flag size={16} /> Lap
        </Button>
        <Button variant="surface" onClick={reset}>
          <RotateCcw size={16} /> Reset
        </Button>
      </div>
      {laps.length > 0 && (
        <div className="mt-3 divide-y divide-border max-h-40 overflow-y-auto no-scrollbar">
          {laps.map((l, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5">
              <span className="text-fg-muted">Lap {laps.length - i}</span>
              <span className="font-semibold tabular">{fmt(l)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
