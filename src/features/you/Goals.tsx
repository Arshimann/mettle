import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Plus, Target, X } from 'lucide-react';
import { Button, Card, CardLabel, EmptyState, Segmented, Sheet } from '../../components/ui';
import { ExercisePicker } from '../../components/ExercisePicker';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { sfxPop } from '../../lib/sound';
import { useStore } from '../../store/useStore';
import { computeStreak } from '../../lib/formulas';
import { fromKg, parseNum, unitLabel } from '../../lib/units';
import { daysTrainedInWeek } from '../../lib/date';
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
    case 'frequency':
      // Distinct DAYS trained this Mon–Sun week — two sessions in one day is
      // still one day, and the count is anchored to the calendar week rather
      // than a rolling window that quietly decays as days age out.
      return daysTrainedInWeek(history.map((h) => h.date));
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

/** One-tap starting points, so a first goal isn't a blank form. */
interface GoalPreset {
  label: string;
  hint: string;
  type: GoalType;
  target: number;
  exercise?: string;
}

const PRESETS: GoalPreset[] = [
  { label: 'Train 3× a week', hint: 'A sustainable base', type: 'frequency', target: 3 },
  { label: 'Train 4× a week', hint: 'Serious but liveable', type: 'frequency', target: 4 },
  { label: '7-day streak', hint: 'Get the habit started', type: 'streak', target: 7 },
  { label: '30-day streak', hint: 'Make it who you are', type: 'streak', target: 30 },
];

export function Goals() {
  const goals = useStore((s) => s.goals);
  const history = useStore((s) => s.history);
  const prs = useStore((s) => s.prs);
  const bodyWeight = useStore((s) => s.bodyWeight);
  const units = useStore((s) => s.settings.units);
  const addGoal = useStore((s) => s.addGoal);
  const removeGoal = useStore((s) => s.removeGoal);
  const completeGoal = useStore((s) => s.completeGoal);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<GoalType>('lift');
  const [exercise, setExercise] = useState('');
  const [target, setTarget] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

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
        // A cut goal counts down, so "reached" follows the direction of travel.
        const reached = denom < 0 ? current <= g.target : current >= g.target;
        return { goal: g, current, pct, reached, done: Boolean(g.completedAt) || reached };
      }),
    [goals, history, prs, bodyWeight, units],
  );

  // Latch newly-reached goals into the store so they stay achieved after the
  // number that earned them moves on (a new week starts, body weight drifts).
  useEffect(() => {
    const fresh = rows.filter((r) => r.reached && !r.goal.completedAt);
    if (fresh.length === 0) return;
    fresh.forEach((r) => completeGoal(r.goal.id));
    haptics.success();
    sfxPop();
  }, [rows, completeGoal]);

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
            {rows.map(({ goal, current, pct, done }) => (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 min-w-0">
                    {done && (
                      <span className="w-4 h-4 rounded-full bg-accent text-accent-fg grid place-items-center shrink-0">
                        <Check size={11} strokeWidth={3.5} />
                      </span>
                    )}
                    <span className="font-medium text-[15px] truncate">{goal.label}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[13px] text-fg-muted tabular">
                      {done ? 'Achieved' : `${current} / ${goal.target} ${suffix(goal)}`}
                    </span>
                    <button onClick={() => removeGoal(goal.id)} className="text-fg-subtle" aria-label="Remove goal">
                      <X size={14} />
                    </button>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-[width] duration-500',
                      done ? 'bg-accent bg-accent-grad' : 'bg-accent',
                    )}
                    style={{ width: `${Math.round((done ? 1 : pct) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New goal">
        {goals.length === 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle mb-2">
              Quick start
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    haptics.success();
                    addGoal({
                      type: p.type,
                      target: p.target,
                      label: p.label,
                      exercise: p.exercise,
                      baseValue: 0,
                    });
                    setOpen(false);
                  }}
                  className="text-left rounded-card bg-surface-2 border border-border p-3"
                >
                  <div className="text-[13px] font-semibold leading-tight">{p.label}</div>
                  <div className="text-[11px] text-fg-subtle mt-0.5">{p.hint}</div>
                </button>
              ))}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle mt-4 mb-2">
              Or build your own
            </div>
          </div>
        )}
        <Segmented fullWidth value={type} onChange={setType} options={TYPE_OPTIONS} />
        <div className="mt-3 space-y-3">
          {/* Picked, never typed: progress matches on an exact name, so a typo
              used to pin a lift goal at 0 forever. */}
          {type === 'lift' && (
            <button
              onClick={() => {
                haptics.tap();
                setPickerOpen(true);
              }}
              className={cn(
                'w-full h-12 px-3.5 rounded-btn bg-surface-2 border text-[15px] text-left flex items-center justify-between',
                exercise ? 'border-border text-fg' : 'border-border text-fg-subtle',
              )}
            >
              <span className="truncate">{exercise || 'Choose an exercise'}</span>
              <ChevronRight size={16} className="text-fg-subtle shrink-0" />
            </button>
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

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(name) => {
          setExercise(name);
          setPickerOpen(false);
        }}
      />
    </Card>
  );
}
