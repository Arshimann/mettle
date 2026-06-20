import { Card, CardLabel } from '../../components/ui';
import { cn } from '../../lib/cn';
import { useStore } from '../../store/useStore';
import { consistency } from '../../lib/formulas';

export function Consistency() {
  const history = useStore((s) => s.history);
  const { grid, trainedCount, totalPast, pct } = consistency(history, 12);

  return (
    <Card>
      <div className="flex items-end justify-between mb-3">
        <div>
          <CardLabel className="mb-0">Consistency</CardLabel>
          <div className="text-2xl font-bold tabular leading-none mt-1.5">
            {trainedCount}
            <span className="text-sm text-fg-muted font-semibold"> / {totalPast} days</span>
          </div>
        </div>
        <div className="text-right">
          <CardLabel className="mb-0">Rate</CardLabel>
          <div className="text-2xl font-bold text-accent tabular leading-none mt-1.5">{pct}%</div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {grid.map((row, r) => (
          <div key={r} className="flex gap-1">
            {row.map((c, i) => (
              <div
                key={i}
                title={c.label}
                className={cn(
                  'flex-1 aspect-square rounded-[3px]',
                  c.future ? 'bg-transparent' : c.trained ? 'bg-accent' : 'bg-surface-2',
                )}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-3 text-[11px] text-fg-subtle">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-accent inline-block" /> Trained
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-surface-2 inline-block" /> Rest
        </span>
        <span className="ml-auto">12 weeks</span>
      </div>
    </Card>
  );
}
