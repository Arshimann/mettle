import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, GraduationCap } from 'lucide-react';
import { Card, CardLabel, CountUp, EmptyState, PageHeader } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { listContainer, listItem } from '../../theme/motion';
import { useStore } from '../../store/useStore';
import { bestE1RM, sessionVolume } from '../../lib/formulas';
import { daysBetween, todayStr } from '../../lib/date';
import { fromKg, unitLabel } from '../../lib/units';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type MuscleGroup } from '../../data/exercises';
import { LESSONS } from '../../data/lessons';
import { LineChart } from '../progress/LineChart';

const GROUP_OF = new Map(EXERCISE_LIBRARY.map((e) => [e.name.toLowerCase(), e.group]));

function Stat({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  return (
    <Card className="p-4 text-center">
      <div className="flex items-baseline justify-center gap-0.5">
        <CountUp value={value} className="text-[26px] font-bold tabular leading-none tracking-tight" />
        {suffix && <span className="text-xs font-semibold text-fg-subtle">{suffix}</span>}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-subtle mt-1.5">{label}</div>
    </Card>
  );
}

export function Learn() {
  const history = useStore((s) => s.history);
  const prs = useStore((s) => s.prs);
  const units = useStore((s) => s.settings.units);
  const [openLesson, setOpenLesson] = useState<number | null>(null);

  const m = useMemo(() => {
    let sets = 0;
    let reps = 0;
    let volKg = 0;
    const groupVol = new Map<MuscleGroup, number>();
    const liftBest = new Map<string, number>();
    const liftCount = new Map<string, number>();

    history.forEach((h) =>
      h.exercises.forEach((ex) => {
        const g = GROUP_OF.get(ex.name.toLowerCase());
        liftCount.set(ex.name, (liftCount.get(ex.name) ?? 0) + 1);
        const e = bestE1RM(ex.sets);
        if (e > (liftBest.get(ex.name) ?? 0)) liftBest.set(ex.name, e);
        ex.sets.forEach((st) => {
          sets += 1;
          reps += st.reps;
          const v = st.weight * st.reps;
          volKg += v;
          if (g) groupVol.set(g, (groupVol.get(g) ?? 0) + v);
        });
      }),
    );

    // Weekly volume for the last 8 weeks (oldest → newest).
    const today = todayStr();
    const weeks = new Array(8).fill(0);
    history.forEach((h) => {
      const wk = Math.floor(daysBetween(h.date, today) / 7);
      if (wk >= 0 && wk < 8) weeks[7 - wk] += sessionVolume(h.exercises);
    });
    const weekly = weeks.map((value) => ({ value: Math.round(fromKg(value, units)) }));

    const topLifts = [...liftBest.entries()]
      .filter(([, e]) => e > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const mostTrained = [...liftCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const groups = MUSCLE_GROUPS.map((g) => ({ g, v: groupVol.get(g) ?? 0 })).filter((x) => x.v > 0);
    const groupMax = groups.reduce((mx, x) => Math.max(mx, x.v), 0) || 1;

    return {
      sets,
      reps,
      volume: Math.round(fromKg(volKg, units)),
      workouts: history.length,
      weekly,
      topLifts,
      mostTrained,
      groups,
      groupMax,
    };
  }, [history, units]);

  const hasData = history.length > 0;

  return (
    <div>
      <PageHeader title="Learn" subtitle="Your numbers & how to use them" />
      <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-3.5">
        {hasData && (
          <>
            <motion.div variants={listItem} className="grid grid-cols-3 gap-3.5">
              <Stat value={m.workouts} label="Workouts" />
              <Stat value={m.volume} label={`${unitLabel(units)} lifted`} />
              <Stat value={m.sets} label="Total sets" />
            </motion.div>

            {m.weekly.filter((w) => w.value > 0).length >= 2 && (
              <motion.div variants={listItem}>
                <Card>
                  <CardLabel>Weekly volume · last 8 weeks</CardLabel>
                  <LineChart data={m.weekly} />
                </Card>
              </motion.div>
            )}

            {m.topLifts.length > 0 && (
              <motion.div variants={listItem}>
                <Card>
                  <CardLabel>Top lifts · estimated 1RM{prs.length ? ` · ${prs.length} PRs` : ''}</CardLabel>
                  <div className="space-y-2 mt-1.5">
                    {m.topLifts.map(([name, e]) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-[15px] truncate">{name}</span>
                        <span className="font-bold tabular shrink-0">
                          {Math.round(fromKg(e, units))} {unitLabel(units)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {m.groups.length > 0 && (
              <motion.div variants={listItem}>
                <Card>
                  <CardLabel>Volume by muscle group</CardLabel>
                  <div className="space-y-2 mt-1.5">
                    {m.groups.map(({ g, v }) => (
                      <div key={g}>
                        <div className="flex items-center justify-between text-[13px] mb-1">
                          <span className="font-medium">{g}</span>
                          <span className="text-fg-muted tabular">{Math.round(fromKg(v, units)).toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${(v / m.groupMax) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </>
        )}

        <motion.div variants={listItem}>
          {!hasData && (
            <Card className="p-0 mb-3.5">
              <EmptyState
                icon={GraduationCap}
                title="Metrics unlock as you train"
                body="Log a few workouts and this fills with your volume, top lifts, and muscle-group balance. Until then, here's the playbook."
              />
            </Card>
          )}
          <div className="flex items-center gap-1.5 text-accent mb-2 px-0.5">
            <GraduationCap size={16} />
            <CardLabel className="mb-0 text-accent">The playbook</CardLabel>
          </div>
          <div className="space-y-2.5">
            {LESSONS.map((lesson, i) => {
              const open = openLesson === i;
              return (
                <Card key={i} className="p-0 overflow-hidden">
                  <button
                    onClick={() => { haptics.tap(); setOpenLesson(open ? null : i); }}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent mb-0.5">{lesson.tag}</div>
                      <div className="font-semibold leading-snug">{lesson.title}</div>
                    </div>
                    <ChevronDown size={18} className={cn('text-fg-subtle shrink-0 transition-transform', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <p className="px-4 pb-4 -mt-1 text-sm text-fg-muted leading-relaxed border-t border-border pt-3">
                      {lesson.body}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
