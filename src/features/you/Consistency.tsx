import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardLabel, Segmented } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { listItem } from '../../theme/motion';
import { addDays, fromISO, prettyDate, toISO } from '../../lib/date';
import { fmtDuration } from '../../lib/date';
import { fromKg, unitLabel } from '../../lib/units';
import { useStore } from '../../store/useStore';
import {
  consistency,
  sessionVolume,
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
export function WeeklyTowers({
  towers,
  target,
  selected,
  onSelect,
}: {
  towers: WeekTower[];
  target?: number;
  /** Selection is opt-in: a friend's profile renders these read-only. */
  selected?: string | null;
  onSelect?: (weekStart: string) => void;
}) {
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
        {towers.map((t) => {
          const isSel = selected === t.weekStart;
          const dimmed = selected != null && !isSel;
          const Tag = onSelect ? 'button' : 'div';
          return (
            <Tag
              key={t.weekStart}
              {...(onSelect
                ? {
                    onClick: () => {
                      haptics.select();
                      onSelect(t.weekStart);
                    },
                    'aria-label': `Week of ${t.label}, ${t.days} day${t.days === 1 ? '' : 's'} trained`,
                    'aria-pressed': isSel,
                  }
                : { title: `${t.label} · ${t.days} days` })}
              className="flex-1 h-full flex flex-col justify-end"
            >
              <div
                className={cn(
                  'w-full rounded-t-[3px] transition-[height,opacity] duration-500',
                  t.days === 0
                    ? 'bg-surface-2'
                    : isSel || t.isCurrent
                      ? 'bg-accent bg-accent-grad'
                      : 'bg-accent/70',
                  dimmed && 'opacity-45',
                )}
                style={{
                  height: `${Math.max(t.days === 0 ? 3 : 8, (t.days / max) * 100)}%`,
                  boxShadow:
                    t.days > 0
                      ? isSel
                        ? '0 0 14px color-mix(in srgb, var(--accent) 70%, transparent)'
                        : '0 0 8px color-mix(in srgb, var(--accent) 40%, transparent)'
                      : undefined,
                }}
              />
            </Tag>
          );
        })}
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
  const prs = useStore((s) => s.prs);
  const units = useStore((s) => s.settings.units);
  const [view, setView] = useState<'weeks' | 'days'>('weeks');
  const [week, setWeek] = useState<string | null>(null);

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
          <WeeklyTowers
            towers={towers}
            target={weeklyTarget}
            selected={week}
            onSelect={(w) => setWeek((cur) => (cur === w ? null : w))}
          />
          <div className="flex items-center gap-3 mt-3 text-[11px] text-fg-subtle">
            <span>{week ? 'Tap the bar again to clear' : 'Tap a week for detail'}</span>
            {weeklyTarget ? <span className="ml-auto">Dashed line · your {weeklyTarget}× goal</span> : <span className="ml-auto">12 weeks</span>}
          </div>

          <AnimatePresence initial={false}>
            {week && (
              <motion.div variants={listItem} initial="hidden" animate="show" exit="hidden" className="mt-3">
                {(() => {
                  const end = toISO(addDays(fromISO(week), 6));
                  const inWeek = (iso: string) => iso >= week && iso <= end;
                  const sessions = history.filter((h) => inWeek(h.date));
                  const days = new Set(sessions.map((h) => h.date)).size;
                  const sets = sessions.reduce(
                    (n, h) => n + h.exercises.reduce((m, ex) => m + ex.sets.length, 0),
                    0,
                  );
                  const vol = Math.round(
                    fromKg(sessions.reduce((v, h) => v + sessionVolume(h.exercises), 0), units),
                  );
                  const hits = prs.filter((p) => inWeek(p.date));
                  const range = `${fromISO(week).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${fromISO(end).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;

                  return (
                    <div className="rounded-btn bg-surface-2 p-3.5">
                      <div className="flex items-baseline justify-between mb-2.5">
                        <div className="text-[13px] font-semibold">{range}</div>
                        <div className="text-[12px] text-fg-muted tabular">
                          {days} day{days === 1 ? '' : 's'}
                          {weeklyTarget ? ` / ${weeklyTarget}` : ''}
                        </div>
                      </div>

                      {sessions.length === 0 ? (
                        <p className="text-[13px] text-fg-muted">Nothing logged this week.</p>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 mb-3">
                            <div>
                              <div className="text-[17px] font-display font-bold tabular leading-none">{sets}</div>
                              <div className="text-[10px] uppercase tracking-[0.12em] text-fg-subtle mt-1">Sets</div>
                            </div>
                            <div>
                              <div className="text-[17px] font-display font-bold tabular leading-none">
                                {vol.toLocaleString()}
                              </div>
                              <div className="text-[10px] uppercase tracking-[0.12em] text-fg-subtle mt-1">
                                {unitLabel(units)} vol
                              </div>
                            </div>
                            {hits.length > 0 && (
                              <div>
                                <div className="text-[17px] font-display font-bold tabular leading-none text-accent">
                                  {hits.length}
                                </div>
                                <div className="text-[10px] uppercase tracking-[0.12em] text-fg-subtle mt-1">PRs</div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            {sessions.map((h) => (
                              <div key={h.id} className="flex items-center gap-2 text-[12.5px]">
                                <span className="text-fg-muted w-[68px] shrink-0">{prettyDate(h.date)}</span>
                                <span className="font-medium truncate flex-1">{h.dayName}</span>
                                {h.durationSec != null && (
                                  <span className="text-fg-subtle tabular shrink-0">
                                    {fmtDuration(h.durationSec)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          {hits.length > 0 && (
                            <div className="text-[12px] text-accent mt-2.5 truncate">
                              PR · {hits.map((p) => p.exercise).join(', ')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
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
