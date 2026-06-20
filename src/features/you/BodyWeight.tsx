import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Card, CardLabel, Sheet } from '../../components/ui';
import { LineChart } from '../progress/LineChart';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { fmtWeight, fromKg, parseNum, toKg, unitLabel } from '../../lib/units';
import { prettyDate, todayStr } from '../../lib/date';

export function BodyWeight() {
  const entries = useStore((s) => s.bodyWeight);
  const units = useStore((s) => s.settings.units);
  const addBodyWeight = useStore((s) => s.addBodyWeight);
  const removeBodyWeight = useStore((s) => s.removeBodyWeight);

  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const deltaKg = latest && prev ? latest.weight - prev.weight : null;
  const chartData = sorted.map((b) => ({ value: b.weight }));

  const save = () => {
    const n = parseNum(val);
    if (isNaN(n) || n <= 0) return;
    addBodyWeight({ date: todayStr(), weight: toKg(val, units) });
    haptics.success();
    setVal('');
    setOpen(false);
  };

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <CardLabel className="mb-0">Body weight</CardLabel>
          {latest ? (
            <div className="text-2xl font-bold tabular leading-none mt-1.5">
              {fmtWeight(latest.weight, units)}{' '}
              <span className="text-sm text-fg-muted font-semibold">{unitLabel(units)}</span>
              {deltaKg != null && Math.abs(deltaKg) >= 0.05 && (
                <span className={cn('text-[13px] font-semibold ml-2', deltaKg < 0 ? 'text-success' : 'text-fg-muted')}>
                  {deltaKg > 0 ? '+' : ''}
                  {fromKg(deltaKg, units)}
                </span>
              )}
            </div>
          ) : (
            <div className="text-sm text-fg-muted mt-1.5">No entries yet</div>
          )}
        </div>
        <Button size="sm" variant="accent" onClick={() => { haptics.tap(); setOpen(true); }}>
          <Plus size={15} /> Log
        </Button>
      </div>

      {chartData.length >= 2 ? (
        <LineChart data={chartData} />
      ) : (
        sorted.length > 0 && <p className="text-sm text-fg-muted">One more entry to see a trend.</p>
      )}

      {sorted.length > 0 && (
        <div className="mt-3 divide-y divide-border">
          {[...sorted].reverse().slice(0, 4).map((b) => (
            <div key={b.id} className="flex items-center justify-between text-sm py-2">
              <span className="text-fg-muted">{prettyDate(b.date)}</span>
              <span className="flex items-center gap-3">
                <span className="font-semibold tabular">
                  {fmtWeight(b.weight, units)} {unitLabel(units)}
                </span>
                <button onClick={() => removeBodyWeight(b.id)} className="text-fg-subtle" aria-label="Remove entry">
                  <X size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Log body weight">
        <input
          autoFocus
          inputMode="decimal"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
          placeholder={`Weight in ${unitLabel(units)}`}
          className="w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong mb-3"
        />
        <Button variant="accent" size="lg" fullWidth onClick={save}>
          Save
        </Button>
      </Sheet>
    </Card>
  );
}
