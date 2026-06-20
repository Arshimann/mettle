import { useState } from 'react';
import { Card, CardLabel } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { estimate1RM } from '../../lib/formulas';
import { fmtWeight, toKg, unitLabel } from '../../lib/units';

const REP_TARGETS = [1, 3, 5, 8, 10, 12];

export function OneRm() {
  const units = useStore((s) => s.settings.units);
  const [w, setW] = useState('');
  const [r, setR] = useState('');

  const wKg = toKg(w, units);
  const reps = parseInt(r, 10) || 0;
  const orm = wKg > 0 && reps > 0 ? estimate1RM(wKg, reps) : 0;

  const inputCls =
    'flex-1 min-w-0 h-12 px-3 rounded-btn bg-surface-2 border border-border text-center text-[15px] font-semibold outline-none focus:border-border-strong';

  return (
    <Card>
      <CardLabel>1RM calculator</CardLabel>
      <div className="flex items-center gap-2 mt-1 mb-1">
        <input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} placeholder={`Weight (${unitLabel(units)})`} className={inputCls} />
        <span className="text-fg-subtle text-sm">×</span>
        <input inputMode="numeric" value={r} onChange={(e) => setR(e.target.value)} placeholder="Reps" className={inputCls} />
      </div>

      {orm > 0 ? (
        <>
          <div className="text-center py-3">
            <div className="text-4xl font-bold tabular leading-none">
              {fmtWeight(orm, units)} <span className="text-base text-fg-muted font-semibold">{unitLabel(units)}</span>
            </div>
            <div className="text-xs text-fg-subtle mt-1.5">Estimated one-rep max</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {REP_TARGETS.map((rp) => (
              <div key={rp} className="bg-surface-2 rounded-btn py-2 text-center">
                <div className="font-bold tabular">{fmtWeight(orm / (1 + rp / 30), units)}</div>
                <div className="text-[11px] text-fg-subtle">{rp} rep{rp > 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-fg-muted mt-2">Enter a weight and reps to estimate your max.</p>
      )}
    </Card>
  );
}
