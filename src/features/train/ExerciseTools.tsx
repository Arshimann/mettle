import { useState } from 'react';
import { Button, CardLabel, Sheet } from '../../components/ui';
import { parseNum, unitLabel } from '../../lib/units';
import { defaultBar, platesPerSide, warmupSets, type WarmupSet } from '../../lib/plates';
import type { Units } from '../../types';

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

export function ExerciseTools({
  open,
  onClose,
  exerciseName,
  initialTarget,
  units,
  onAddWarmup,
}: {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  initialTarget: number;
  units: Units;
  onAddWarmup: (sets: WarmupSet[]) => void;
}) {
  const [target, setTarget] = useState('');
  const [bar, setBar] = useState('');

  const u = unitLabel(units);
  const effTarget = parseNum(target) || initialTarget;
  const effBar = parseNum(bar) || defaultBar(units);
  const plates = platesPerSide(effTarget, effBar, units);
  const warmup = warmupSets(effTarget, units);

  const inputCls =
    'w-full h-12 px-3 rounded-btn bg-surface-2 border border-border text-center text-[15px] font-semibold outline-none focus:border-border-strong';

  return (
    <Sheet open={open} onClose={onClose} title={exerciseName ? `${exerciseName} · tools` : 'Tools'}>
      <CardLabel>Plate calculator</CardLabel>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1">
          <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={initialTarget ? fmt(initialTarget) : `Target ${u}`} className={inputCls} />
          <div className="text-[11px] text-fg-subtle text-center mt-1">Target ({u})</div>
        </div>
        <div className="flex-1">
          <input inputMode="decimal" value={bar} onChange={(e) => setBar(e.target.value)} placeholder={fmt(defaultBar(units))} className={inputCls} />
          <div className="text-[11px] text-fg-subtle text-center mt-1">Bar ({u})</div>
        </div>
      </div>

      <div className="bg-surface-2 rounded-btn p-3.5 mb-5 text-center">
        {effTarget <= effBar ? (
          <div className="text-sm text-fg-muted">Just the bar.</div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-1.5">
              {plates.plates.map((p, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-accent-soft text-accent text-[13px] font-bold tabular">
                  {p.count} × {fmt(p.plate)}
                </span>
              ))}
            </div>
            <div className="text-[12px] text-fg-subtle mt-2">
              per side{plates.leftover > 0 ? ` · ≈ ${fmt(plates.leftover)} ${u} short of exact` : ''}
            </div>
          </>
        )}
      </div>

      <CardLabel>Warm-up</CardLabel>
      {warmup.length === 0 ? (
        <p className="text-sm text-fg-muted">Enter a working weight to generate a warm-up.</p>
      ) : (
        <>
          <div className="space-y-1.5 mb-3">
            {warmup.map((w, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-2 rounded-btn px-3 h-10 text-[14px]">
                <span className="text-fg-muted">Set {i + 1}</span>
                <span className="font-semibold tabular">
                  {fmt(w.weight)} {u} × {w.reps}
                </span>
              </div>
            ))}
          </div>
          <Button variant="accent" size="lg" fullWidth onClick={() => onAddWarmup(warmup)}>
            Add warm-up to workout
          </Button>
        </>
      )}
    </Sheet>
  );
}
