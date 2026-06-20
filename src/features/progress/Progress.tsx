import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { Card, CardLabel, EmptyState, PageHeader } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { listContainer, listItem } from '../../theme/motion';
import { useStore } from '../../store/useStore';
import { bestE1RM, sessionVolume } from '../../lib/formulas';
import { fmtWeight, unitLabel } from '../../lib/units';
import { prettyDate } from '../../lib/date';
import { LineChart } from './LineChart';

export function Progress() {
  const prs = useStore((s) => s.prs);
  const history = useStore((s) => s.history);
  const units = useStore((s) => s.settings.units);

  const exerciseNames = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => h.exercises.forEach((e) => set.add(e.name)));
    return [...set];
  }, [history]);

  const [selected, setSelected] = useState<string | null>(null);
  const sel = selected && exerciseNames.includes(selected) ? selected : (exerciseNames[0] ?? null);

  const chartData = useMemo(() => {
    if (!sel) return [];
    const lower = sel.toLowerCase();
    return [...history]
      .reverse()
      .flatMap((h) => {
        const ex = h.exercises.find((e) => e.name.toLowerCase() === lower);
        return ex ? [{ value: bestE1RM(ex.sets) }] : [];
      });
  }, [history, sel]);
  const bestEver = chartData.length ? Math.max(...chartData.map((d) => d.value)) : 0;

  const [expanded, setExpanded] = useState<string | null>(null);

  if (prs.length === 0 && history.length === 0) {
    return (
      <div>
        <PageHeader title="Progress" subtitle="PRs, charts & history" />
        <Card className="p-0">
          <EmptyState
            icon={TrendingUp}
            title="Nothing logged yet"
            body="Finish your first workout and your records, charts, and history appear here."
          />
        </Card>
      </div>
    );
  }

  return (
    <motion.div variants={listContainer} initial="hidden" animate="show">
      <PageHeader title="Progress" subtitle={`${history.length} workout${history.length === 1 ? '' : 's'} logged`} />

      {sel && (
        <motion.div variants={listItem}>
          <Card className="mb-3.5">
            <div className="flex items-center justify-between mb-2">
              <CardLabel className="mb-0">Estimated 1RM · {sel}</CardLabel>
              {bestEver > 0 && (
                <span className="text-sm font-bold tabular">
                  {fmtWeight(bestEver, units)} {unitLabel(units)}
                </span>
              )}
            </div>
            {chartData.length >= 2 ? (
              <LineChart data={chartData} />
            ) : (
              <div className="text-sm text-fg-muted py-6 text-center">
                Log <span className="font-semibold text-fg">{sel}</span> at least twice to see a trend.
              </div>
            )}
            {exerciseNames.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-3 -mx-1 px-1">
                {exerciseNames.map((n) => (
                  <button
                    key={n}
                    onClick={() => { haptics.tap(); setSelected(n); }}
                    className={cn(
                      'shrink-0 px-3 h-8 rounded-full text-[12px] font-semibold border transition-colors',
                      n === sel ? 'bg-accent text-accent-fg border-accent' : 'bg-surface-2 text-fg-muted border-border',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {prs.length > 0 && (
        <motion.div variants={listItem}>
          <Card className="mb-3.5">
            <CardLabel>Personal records</CardLabel>
            <div className="divide-y divide-border">
              {prs.slice(0, 8).map((pr) => (
                <div key={pr.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{pr.exercise}</div>
                    <div className="text-xs text-fg-subtle">{prettyDate(pr.date)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold tabular">{fmtWeight(pr.weight, units)}</span>
                    <span className="text-sm text-fg-muted"> {unitLabel(units)} × {pr.reps}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {history.length > 0 && (
        <motion.div variants={listItem}>
          <h2 className="text-lg mb-2 px-0.5">History</h2>
          <div className="space-y-2.5">
            {history.map((h) => {
              const open = expanded === h.id;
              const sets = h.exercises.reduce((n, ex) => n + ex.sets.length, 0);
              return (
                <Card key={h.id} className="p-0 overflow-hidden">
                  <button
                    onClick={() => { haptics.tap(); setExpanded(open ? null : h.id); }}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{h.dayName || 'Workout'}</div>
                      <div className="text-xs text-fg-muted mt-0.5">
                        {prettyDate(h.date)} · {h.exercises.length} ex · {sets} sets ·{' '}
                        {Math.round(sessionVolume(h.exercises)).toLocaleString()} {unitLabel(units)}
                      </div>
                    </div>
                    <ChevronDown size={18} className={cn('text-fg-subtle shrink-0 transition-transform', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <div className="px-4 pb-4 space-y-2.5 border-t border-border">
                      {h.exercises.map((ex, i) => (
                        <div key={i} className="pt-2.5">
                          <div className="text-sm font-semibold mb-1.5">{ex.name}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {ex.sets.map((s, j) => (
                              <span key={j} className="text-[12px] px-2 py-1 rounded-md bg-surface-2 text-fg-muted tabular">
                                {fmtWeight(s.weight, units)}×{s.reps}
                                {s.toFailure ? ' · F' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {h.note && <div className="text-sm text-fg-muted pt-1 italic">“{h.note}”</div>}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
