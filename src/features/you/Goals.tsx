import { useMemo, useState } from 'react';
import { Plus, Target, X } from 'lucide-react';
import { Button, Card, CardLabel, EmptyState, Segmented, Sheet } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { computeStreak } from '../../lib/formulas';
import { fromKg, parseNum, unitLabel } from '../../lib/units';
import { daysBetween, todayStr } from '../../lib/date';
import type { BodyWeightEntry, Goal, GoalType, HistoryEntry, PR, Units } from '../../types';

interface GoalCtx {
  history: HistoryEntry[];
  prs: PR[];
  bodyWeight: BodyWeightEntry[];
  units: Units;
}

function currentValue(goal: Goal, { history, prs, bodyWeight, units }: GoalCtx): number {
  switch (goal.type) {
    case 'bodyweight': {
      const sorted = [...bodyWeight].sort((a, b) => a.date.localeCompare(b.date));
      const l = sorted[sorted.length - 1];
      return l ? Math.round(fromKg(l.weight, units)) : 0;
    }
    case 'lift': {
      const lower = (goal.exercise ?? '').toLowerCase();
      // Heaviest weight you've actually hit for this lift = your PR. Look across
      // both workout history AND the PR list, so an existing record counts even
      // if it predates the goal or isn't in recent sessions.
      let best = 0;
      history.forEach((h) =>
        h.exercises.forEach((e) => {
          if (e.name.toLowerCase() === lower) {
            e.sets.forEach((s) => {
              if (s.weight > best) best = s.weight;
            });
          }
        }),
      );
      prs.forEach((p) => {
        if (p.exercise.toLowerCase() === lower && p.weight > best) best = p.weight;
      });
      return Math.round(fromKg(best, units));
    }
    case 'frequency': {
      const today = todayStr();
      return history.filter((h) => {
        const d = daysBetween(h.date, today);
        return d >= 0 && d < 7;
      }).length;
    }
    case 'streak':
      return computeStreak(history);
    default:
      return 0;
  }
}

const TYPE_OPTIONS = [
  { value: 'lift' as GoalType, label: 'Lift' },
  { value: 'bodyweight' as GoalType, label: 'Weight' },
  { value: 'frequency' as GoalType, label: 'Weekly' },
  { value: 'streak' as GoalType, label: 'Streak' },
];

export function Goals() {
  const goals = useStore((s) => s.goals);
  const history = useStore((s) => s.history);
  const prs = useStore((s) => s.prs);
  const bodyWeight = useStore((s) => s.bodyWeight);
  const units = useStore((s) => s.settings.units);
  const addGoal = useStore((s) => s.addGoal);
  const removeGoal = useStore((s) => s.removeGoal);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<GoalType>('lift');
  const [exercise, setExercise] = useState('');
  const [target, setTarget] = useState('');

  const unit = unitLabel(units);

  const rows = useMemo(
    () =>
      goals.map((g) => {
        const current = currentValue(g, { history, prs, bodyWeight, units });
        // Body-weight goals measure from where you started (can go up or down);
        // lift/frequency/streak measure from 0 so your existing PR shows immediately.
        const base = g.type === 'bodyweight' ? (g.baseValue ?? current) : 0;
        const denom = g.target - base;
        const pct =
          denom !== 0 ? Math.max(0, Math.min(1, (current - base) / denom)) : current >= g.target ? 1 : 0;
        return { goal: g, current, pct };
      }),
    [goals, history, prs, bodyWeight, units],
  );

  const save = () => {
    const t = parseNum(target);
    if (isNaN(t) || t <= 0) return;
    let label: string;
    if (type === 'lift') {
      if (!exercise.trim()) return;
      label = `${exercise.trim()} · ${t}${unit}`;
    } else if (type === 'bodyweight') label = `Body weight · ${t}${unit}`;
    else if (type === 'frequency') label = `${t}× per week`;
    else label = `${t}-day streak`;

    const ex = type === 'lift' ? exercise.trim() : undefined;
    const base = currentValue({ id: '', type, target: t, exercise: ex, label, createdAt: '' }, { history, prs, bodyWeight, units });
    addGoal({ type, target: t, label, exercise: ex, baseValue: base });
    haptics.success();
    setExercise('');
    setTarget('');
    setOpen(false);
  };

  const suffix = (g: Goal) =>
    g.type === 'lift' || g.type === 'bodyweight' ? unit : g.type === 'streak' ? 'd' : '×';

  return (
    <Card className={goals.length === 0 ? 'p-0' : undefined}>
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          body="Set a target lift, body weight, weekly sessions, or a streak."
          action={<Button variant="accent" onClick={() => { haptics.tap(); setOpen(true); }}>Add a goal</Button>}
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <CardLabel className="mb-0">Goals</CardLabel>
            <Button size="sm" variant="accent" onClick={() => { haptics.tap(); setOpen(true); }}>
              <Plus size={15} /> Add
            </Button>
          </div>
          <div className="space-y-3.5">
            {rows.map(({ goal, current, pct }) => (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-[15px] truncate">{goal.label}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[13px] text-fg-muted tabular">
                      {current} / {goal.target} {suffix(goal)}
                    </span>
                    <button onClick={() => removeGoal(goal.id)} className="text-fg-subtle" aria-label="Remove goal">
                      <X size={14} />
                    </button>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-500"
                    style={{ width: `${Math.round(pct * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New goal">
        <Segmented fullWidth value={type} onChange={setType} options={TYPE_OPTIONS} />
        <div className="mt-3 space-y-3">
          {type === 'lift' && (
            <input
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              placeholder="Exercise (e.g. Bench Press)"
              className="w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong"
            />
          )}
          <input
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={
              type === 'frequency' ? 'Sessions per week' : type === 'streak' ? 'Target days' : `Target ${unit}`
            }
            className="w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong"
          />
          <Button variant="accent" size="lg" fullWidth onClick={save}>
            Add goal
          </Button>
        </div>
      </Sheet>
    </Card>
  );
}
