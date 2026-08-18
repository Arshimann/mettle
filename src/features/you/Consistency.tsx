import { useState } from 'react';
import { Card, CardLabel, Segmented } from '../../components/ui';
import { cn } from '../../lib/cn';
import { useStore } from '../../store/useStore';
import {
  consistency,
  weeklyTowers,
  type Consistency as ConsistencyData,
  type WeekTower,
} from '../../lib/formulas';

/** The bare heatmap grid — shared between the You tab and friend profiles. */
export function ConsistencyGrid({ grid }: { grid: ConsistencyData['grid'] }) {
  return (
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
              style={
                c.trained
                  ? { boxShadow: '0 0 7px color-mix(in srgb, var(--accent) 55%, transparent)' }
                  : undefined
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Weeks as towers — one bar per Mon–Sun week, height = days trained. Reads at a
 * glance in a way the day-grid never did, and its columns are real weeks (the
 * heatmap's rows are offset buckets, so its top row isn't Mondays).
 */
export function WeeklyTowers({ towers, target }: { towers: WeekTower[]; target?: number }) {
  const max = 7;
  return (
    <div>
      <div className="relative flex items-end gap-[3px] h-[92px]">
        {target && target > 0 && target <= max && (
          <div
            className="absolute inset-x-0 border-t border-dashed border-accent/45 pointer-events-none"
            style={{ bottom: `${(target / max) * 100}%` }}
            aria-hidden
          />
        )}
        {towers.map((t) => (
          <div key={t.weekStart} className="flex-1 h-full flex flex-col justify-end" title={`${t.label} · ${t.days} days`}>
            <div
              className={cn(
                'w-full rounded-t-[3px] transition-[height] duration-500',
                t.days === 0
                  ? 'bg-surface-2'
                  : t.isCurrent
                    ? 'bg-accent bg-accent-grad'
                    : 'bg-accent/70',
              )}
              style={{
                height: `${Math.max(t.days === 0 ? 3 : 8, (t.days / max) * 100)}%`,
                boxShadow: t.days > 0 ? '0 0 8px color-mix(in srgb, var(--accent) 40%, transparent)' : undefined,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-fg-subtle">
        <span>{towers[0]?.label}</span>
        <span>This week</span>
      </div>
    </div>
  );
}

export function Consistency() {
  const history = useStore((s) => s.history);
  const goals = useStore((s) => s.goals);
  const [view, setView] = useState<'weeks' | 'days'>('weeks');

  const { grid, trainedCount, totalPast, pct } = consistency(history, 12);
  const towers = weeklyTowers(history, 12);
  // Draw the target line from a weekly-frequency goal, if one exists.
  const weeklyTarget = goals.find((g) => g.type === 'frequency')?.target;

  return (
    <Card>
      <div className="flex items-end justify-between mb-3">
        <div>
          <CardLabel className="mb-0">Consistency</CardLabel>
          <div className="text-[26px] font-display font-bold tabular leading-none mt-1.5">
            {trainedCount}
            <span className="text-sm text-fg-muted font-semibold tracking-normal"> / {totalPast} days</span>
          </div>
        </div>
        <div className="text-right">
          <CardLabel className="mb-0">Rate</CardLabel>
          <div className="text-[26px] font-display font-bold text-accent tabular leading-none mt-1.5">{pct}%</div>
        </div>
      </div>

      <div className="mb-3.5">
        <Segmented
          fullWidth
          value={view}
          onChange={setView}
          options={[
            { value: 'weeks' as const, label: 'Weeks' },
            { value: 'days' as const, label: 'Days' },
          ]}
        />
      </div>

      {view === 'weeks' ? (
        <>
          <WeeklyTowers towers={towers} target={weeklyTarget} />
          <div className="flex items-center gap-3 mt-3 text-[11px] text-fg-subtle">
            <span>Days trained each week</span>
            {weeklyTarget ? <span className="ml-auto">Dashed line · your {weeklyTarget}× goal</span> : <span className="ml-auto">12 weeks</span>}
          </div>
        </>
      ) : (
        <>
          <ConsistencyGrid grid={grid} />
          <div className="flex items-center gap-3 mt-3 text-[11px] text-fg-subtle">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-accent inline-block" /> Trained
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-surface-2 inline-block" /> Rest
            </span>
            <span className="ml-auto">12 weeks</span>
          </div>
        </>
      )}
    </Card>
  );
}
