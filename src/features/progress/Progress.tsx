import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Star, TrendingUp } from 'lucide-react';
import { Card, CardLabel, EmptyState, PageHeader } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { listContainer, listItem } from '../../theme/motion';
import { useStore } from '../../store/useStore';
import { bestE1RM, estimate1RM, sessionVolume } from '../../lib/formulas';
import { distanceLabel, fmtWeight, fromKm, unitLabel } from '../../lib/units';
import { prettyDate } from '../../lib/date';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type MuscleGroup } from '../../data/exercises';
import { LineChart } from './LineChart';

const LIB_GROUP = new Map(EXERCISE_LIBRARY.map((e) => [e.name.toLowerCase(), e.group]));

type TrendGroup = MuscleGroup | 'Other';

export function Progress() {
  const prs = useStore((s) => s.prs);
  const history = useStore((s) => s.history);
  const customExercises = useStore((s) => s.customExercises);
  const units = useStore((s) => s.settings.units);

  // Group every logged exercise by muscle group so the trend picker is
  // two-level (group → exercise) instead of one endless chip row.
  // Cardio is excluded — minutes have no e1RM trend.
  const trendGroups = useMemo(() => {
    const groupOf = (name: string): TrendGroup => {
      const lower = name.toLowerCase();
      const g = LIB_GROUP.get(lower) ?? customExercises.find((c) => c.name.toLowerCase() === lower)?.group;
      return g ?? 'Other';
    };
    const byGroup = new Map<TrendGroup, string[]>();
    const seen = new Set<string>();
    history.forEach((h) =>
      h.exercises.forEach((e) => {
        const key = e.name.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        const g = groupOf(e.name);
        if (g === 'Cardio') return;
        byGroup.set(g, [...(byGroup.get(g) ?? []), e.name]);
      }),
    );
    const order: TrendGroup[] = [...MUSCLE_GROUPS.filter((g) => g !== 'Cardio'), 'Other'];
    return order.filter((g) => (byGroup.get(g) ?? []).length > 0).map((g) => ({ group: g, names: byGroup.get(g)! }));
  }, [history, customExercises]);

  const [selGroup, setSelGroup] = useState<TrendGroup | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const activeGroup =
    (selGroup && trendGroups.find((t) => t.group === selGroup)) || trendGroups[0] || null;
  const sel =
    selected && activeGroup?.names.includes(selected) ? selected : (activeGroup?.names[0] ?? null);

  const chartData = useMemo(() => {
    if (!sel) return [];
    const lower = sel.toLowerCase();
    return [...history]
      .reverse()
      .flatMap((h) => {
        const ex = h.exercises.find((e) => e.name.toLowerCase() === lower);
        return ex ? [{ value: bestE1RM(ex.sets), label: prettyDate(h.date) }] : [];
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
              <LineChart data={chartData} format={(v) => `${fmtWeight(v, units)} ${unitLabel(units)}`} />
            ) : (
              <div className="text-sm text-fg-muted py-6 text-center">
                Log <span className="font-semibold text-fg">{sel}</span> at least twice to see a trend.
              </div>
            )}
            {trendGroups.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-3 -mx-1 px-1">
                {trendGroups.map((t) => (
                  <button
                    key={t.group}
                    onClick={() => { haptics.tap(); setSelGroup(t.group); }}
                    className={cn(
                      'shrink-0 px-3 h-8 rounded-full text-[12px] font-bold uppercase tracking-wide border transition-colors',
                      t.group === activeGroup?.group
                        ? 'bg-fg text-canvas border-fg'
                        : 'bg-surface-2 text-fg-muted border-border',
                    )}
                  >
                    {t.group}
                  </button>
                ))}
              </div>
            )}
            {activeGroup && activeGroup.names.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2 -mx-1 px-1">
                {activeGroup.names.map((n) => (
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
                      {h.exercises.map((ex, i) => {
                        // Top set = the set with the best estimated 1RM (your max effort).
                        let topIdx = 0;
                        let topE = 0;
                        ex.sets.forEach((s, k) => {
                          const e = estimate1RM(s.weight, s.reps);
                          if (e > topE) {
                            topE = e;
                            topIdx = k;
                          }
                        });
                        return (
                          <div key={i} className="pt-2.5">
                            <div className="text-sm font-semibold mb-1.5">{ex.name}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {ex.sets.map((s, j) => {
                                const isTop = topE > 0 && j === topIdx && ex.sets.length > 1;
                                return (
                                  <span
                                    key={j}
                                    className={cn(
                                      'text-[12px] px-2 py-1 rounded-md tabular flex items-center gap-1',
                                      isTop ? 'bg-accent-soft text-accent font-semibold' : 'bg-surface-2 text-fg-muted',
                                    )}
                                  >
                                    {isTop && <Star size={11} fill="currentColor" strokeWidth={0} />}
                                    {s.durationMin != null
                                      ? `${s.durationMin} min${s.distanceKm ? ` · ${fromKm(s.distanceKm, units)} ${distanceLabel(units)}` : ''}`
                                      : `${fmtWeight(s.weight, units)}×${s.reps}`}
                                    {s.toFailure ? ' · F' : ''}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
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
