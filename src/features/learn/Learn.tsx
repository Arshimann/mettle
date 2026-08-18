import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { Card, CardLabel, CountUp, EmptyState, PageHeader, Segmented } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { listContainer, listItem } from '../../theme/motion';
import { useStore } from '../../store/useStore';
import { bestE1RM, sessionVolume } from '../../lib/formulas';
import { daysBetween, todayStr } from '../../lib/date';
import { fromKg, unitLabel } from '../../lib/units';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type MuscleGroup } from '../../data/exercises';
import { LineChart } from '../progress/LineChart';
import { buildMuscleReport } from '../../lib/muscleAnalysis';
import { MuscleBalance } from './MuscleBalance';
import { Playbook } from './Playbook';
import { useUI } from '../../store/useUI';

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
  const navigate = useUI((s) => s.navigate);
  const prs = useStore((s) => s.prs);
  const units = useStore((s) => s.settings.units);
  const customExercises = useStore((s) => s.customExercises);
  const muscleReport = useMemo(
    () => buildMuscleReport(history, customExercises),
    [history, customExercises],
  );

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
    const weekly = weeks.map((value, i) => ({
      value: Math.round(fromKg(value, units)),
      label: i === 7 ? 'This week' : `${7 - i} wk ago`,
    }));

    const topLifts = [...liftBest.entries()]
      .filter(([, e]) => e > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const mostTrained = [...liftCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const groups = MUSCLE_GROUPS.map((g) => ({ g, v: groupVol.get(g) ?? 0 })).filter((x) => x.v > 0);
    const groupMax = groups.reduce((mx, x) => Math.max(mx, x.v), 0) || 1;

    // ---- Coach's read: last 4 weeks, only once there's enough data to judge ----
    const recent = history.filter((h) => {
      const d = daysBetween(h.date, today);
      return d >= 0 && d < 28;
    });
    let read: null | { dominant: string; dominantPct: number; weak: string; weakPct: number; missing: string | null; topLift: string | null } = null;
    if (recent.length >= 6) {
      const recVol = new Map<MuscleGroup, number>();
      recent.forEach((h) =>
        h.exercises.forEach((ex) => {
          const g = GROUP_OF.get(ex.name.toLowerCase());
          if (!g || g === 'Cardio') return;
          ex.sets.forEach((st) => recVol.set(g, (recVol.get(g) ?? 0) + st.weight * st.reps));
        }),
      );
      const trained = [...recVol.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
      const total = trained.reduce((s2, [, v]) => s2 + v, 0);
      if (trained.length >= 2 && total > 0) {
        const [domG, domV] = trained[0];
        const [weakG, weakV] = trained[trained.length - 1];
        // A big group they never touch is a louder signal than a small share.
        const majors: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders'];
        const missing = majors.find((g) => !recVol.get(g)) ?? null;
        read = {
          dominant: domG,
          dominantPct: Math.round((domV / total) * 100),
          weak: weakG,
          weakPct: Math.round((weakV / total) * 100),
          missing,
          topLift: topLifts[0]?.[0] ?? null,
        };
      }
    }

    return {
      read,
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
  // Stats live under Insights, lessons under Playbook — new users land on lessons.
  const [tab, setTab] = useState<'insights' | 'playbook'>(hasData ? 'insights' : 'playbook');

  return (
    <div>
      <PageHeader title="Learn" subtitle="Your numbers & how to use them" />
      <div className="mb-3.5">
        <Segmented
          fullWidth
          value={tab}
          onChange={(v) => { haptics.tap(); setTab(v); }}
          options={[
            { value: 'insights', label: 'Insights' },
            { value: 'playbook', label: 'Playbook' },
          ]}
        />
      </div>

      {tab === 'insights' ? (
      <motion.div key="insights" variants={listContainer} initial="hidden" animate="show" className="space-y-3.5">
        {!hasData && (
          <motion.div variants={listItem}>
            <Card className="p-0">
              <EmptyState
                icon={GraduationCap}
                title="Metrics unlock as you train"
                body="Log a few workouts and this fills with your volume, top lifts, and muscle-group balance. Until then, check the playbook."
              />
            </Card>
          </motion.div>
        )}
        {hasData && (
          <>
            {/* The fine-grained read comes first — it's the specific one. */}
            <motion.div variants={listItem}>
              <MuscleBalance
                report={muscleReport}
                onAddExercise={(name) => navigate('split', { addExercise: name })}
              />
            </motion.div>
            {m.read && (
              <motion.div variants={listItem}>
                <Card>
                  <CardLabel>Coach's read · last 4 weeks</CardLabel>
                  <div className="space-y-2 mt-1">
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold">{m.read.dominant}</span> is where your work goes —{' '}
                      {m.read.dominantPct}% of your recent volume
                      {m.read.topLift ? (
                        <>
                          , led by <span className="font-semibold">{m.read.topLift}</span>
                        </>
                      ) : null}
                      .
                    </p>
                    <p className="text-sm leading-relaxed text-fg-muted">
                      {m.read.missing
                        ? `${m.read.missing} hasn't been trained in four weeks — that's a hole worth filling.`
                        : `${m.read.weak} is only ${m.read.weakPct}% of your volume. One more ${m.read.weak.toLowerCase()} session a week would balance you out.`}
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}
            <motion.div variants={listItem} className="grid grid-cols-3 gap-3.5">
              <Stat value={m.workouts} label="Workouts" />
              <Stat value={m.volume} label={`${unitLabel(units)} lifted`} />
              <Stat value={m.sets} label="Total sets" />
            </motion.div>

            {m.weekly.filter((w) => w.value > 0).length >= 2 && (
              <motion.div variants={listItem}>
                <Card>
                  <CardLabel>Weekly volume · last 8 weeks</CardLabel>
                  <LineChart data={m.weekly} format={(v) => `${v.toLocaleString()} ${unitLabel(units)}`} />
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
      </motion.div>
      ) : (
      <motion.div key="playbook" variants={listContainer} initial="hidden" animate="show">
        <motion.div variants={listItem}>
          <div className="flex items-center gap-1.5 text-accent mb-2 px-0.5">
            <GraduationCap size={16} />
            <CardLabel className="mb-0 text-accent">The playbook</CardLabel>
          </div>
          <Playbook />
        </motion.div>
      </motion.div>
      )}

    </div>
  );
}
