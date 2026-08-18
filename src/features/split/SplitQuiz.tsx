import { useMemo, useState } from 'react';
import { ChevronLeft, Sparkles, Target } from 'lucide-react';
import { Button, Card, CardLabel, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { buildMuscleReport } from '../../lib/muscleAnalysis';
import { REGIONS, FIX_EXERCISES, type MuscleRegion } from '../../data/muscleMap';
import { DAY_TEMPLATES } from '../../data/dayTemplates';
import { TEMPLATES } from '../../data/templates';
import { EXERCISE_LIBRARY } from '../../data/exercises';
import type { ApplyMode, SplitExercise } from '../../types';

const LIB_GROUP = new Map(EXERCISE_LIBRARY.map((e) => [e.name.toLowerCase(), e.group]));

type Goal = 'size' | 'strength' | 'aesthetics' | 'general';
type Days = 3 | 4 | 5 | 6;

interface Answers {
  goal: Goal;
  days: Days;
}

const GOALS: { id: Goal; label: string; blurb: string }[] = [
  { id: 'size', label: 'Build muscle', blurb: 'Volume across everything' },
  { id: 'aesthetics', label: 'Look the part', blurb: 'Delts, back width, arms' },
  { id: 'strength', label: 'Get strong', blurb: 'Heavy compounds first' },
  { id: 'general', label: 'Overall fitness', blurb: 'A bit of everything' },
];

/** Template best matched to goal + days available. */
function baseTemplateId(goal: Goal, days: Days): string {
  if (goal === 'aesthetics') return 'aesthetics';
  if (goal === 'strength') return days <= 4 ? 'upper-lower' : 'phul';
  if (goal === 'general') return days <= 3 ? 'full-body' : 'upper-lower';
  return days <= 3 ? 'full-body' : days === 4 ? 'upper-lower' : 'ppl';
}

/**
 * Builds a split from what you answer AND what you've actually logged: the
 * region engine finds your under-trained areas, and those get extra work
 * bolted onto the matched template. A generic template can't know that your
 * side delts have been neglected for two months — your history can.
 */
export function SplitQuiz({ open, onClose }: { open: boolean; onClose: () => void }) {
  const history = useStore((s) => s.history);
  const customExercises = useStore((s) => s.customExercises);
  const split = useStore((s) => s.split);
  const applyTemplate = useStore((s) => s.applyTemplate);

  const [answers, setAnswers] = useState<Answers | null>(null);
  const [goal, setGoal] = useState<Goal>('size');
  const [days, setDays] = useState<Days>(4);
  const [mode, setMode] = useState<ApplyMode>('replace');

  const report = useMemo(
    () => buildMuscleReport(history, customExercises),
    [history, customExercises],
  );

  /** Regions that are behind, worst first — the personalised half. */
  const weakRegions: MuscleRegion[] = useMemo(() => {
    if (report.thin) return [];
    return report.rows
      .filter((r) => r.status === 'none' || r.status === 'low')
      .sort((a, b) => a.perWeek / a.target[0] - b.perWeek / b.target[0])
      .slice(0, 3)
      .map((r) => r.region);
  }, [report]);

  const plan = useMemo(() => {
    if (!answers) return null;
    const tpl = TEMPLATES.find((t) => t.id === baseTemplateId(answers.goal, answers.days));
    if (!tpl) return null;

    // Trim or pad the template's days to what you can actually train.
    const dayList = tpl.days.slice(0, answers.days).map((d) => ({ ...d, exercises: [...d.exercises] }));
    while (dayList.length < answers.days) {
      const filler = DAY_TEMPLATES.find((d) => !dayList.some((x) => x.name === d.name));
      if (!filler) break;
      dayList.push({ name: filler.name, exercises: [...filler.exercises] });
    }

    // Place each fix on a day that already trains that muscle group — a row
    // belongs on a pull or upper day, not wherever there happened to be room.
    // Only if no day matches does it fall back to the emptiest.
    const added: { region: MuscleRegion; exercise: string; day: string }[] = [];
    for (const region of weakRegions) {
      const pick = FIX_EXERCISES[region].find(
        (name) => !dayList.some((d) => d.exercises.some((e) => e.name.toLowerCase() === name.toLowerCase())),
      );
      if (!pick) continue;
      const group = REGIONS[region].group;
      const score = (d: (typeof dayList)[number]) =>
        d.exercises.filter((e) => LIB_GROUP.get(e.name.toLowerCase()) === group).length;
      const target = [...dayList].sort(
        (a, b) => score(b) - score(a) || a.exercises.length - b.exercises.length,
      )[0];
      const ex: SplitExercise = { name: pick, targetSets: 3, targetReps: '10–15' };
      target.exercises.push(ex);
      added.push({ region, exercise: pick, day: target.name });
    }

    return { tpl, dayList, added };
  }, [answers, weakRegions]);

  const reset = () => {
    setAnswers(null);
    onClose();
  };

  return (
    <Sheet open={open} onClose={reset} title={plan ? 'Your split' : 'Build me a split'}>
      {!plan ? (
        <div>
          <p className="text-sm text-fg-muted leading-relaxed -mt-1 mb-4">
            Two questions, then it reads your logged training to find what you’ve been neglecting.
          </p>

          <CardLabel>What are you training for?</CardLabel>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  haptics.select();
                  setGoal(g.id);
                }}
                className={cn(
                  'rounded-card border p-3 text-left transition-colors',
                  goal === g.id ? 'border-accent bg-accent-soft' : 'border-border bg-surface-2',
                )}
              >
                <div className="text-[13px] font-semibold leading-tight">{g.label}</div>
                <div className="text-[11px] text-fg-subtle mt-0.5">{g.blurb}</div>
              </button>
            ))}
          </div>

          <CardLabel>Days a week you can train</CardLabel>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {([3, 4, 5, 6] as Days[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  haptics.select();
                  setDays(d);
                }}
                className={cn(
                  'h-12 rounded-card border font-bold tabular transition-colors',
                  days === d ? 'border-accent bg-accent-soft text-fg' : 'border-border bg-surface-2 text-fg-muted',
                )}
              >
                {d}
              </button>
            ))}
          </div>

          {report.thin ? (
            <p className="text-[12px] text-fg-subtle leading-snug mb-3.5">
              You haven’t logged enough yet for the weak-point half — this will build from your answers alone,
              and get smarter once you have about six sessions in.
            </p>
          ) : weakRegions.length > 0 ? (
            <div className="rounded-card bg-surface-2 border border-border p-3 mb-3.5">
              <div className="flex items-center gap-1.5 text-accent mb-1">
                <Target size={13} />
                <span className="text-[11px] font-bold uppercase tracking-[0.1em]">From your history</span>
              </div>
              <p className="text-[12.5px] text-fg-muted leading-snug">
                Behind right now: {weakRegions.map((r) => REGIONS[r].label.toLowerCase()).join(', ')}. Extra work
                for these gets added to the plan.
              </p>
            </div>
          ) : null}

          <Button
            variant="accent"
            size="lg"
            fullWidth
            onClick={() => {
              haptics.tap();
              setAnswers({ goal, days });
            }}
          >
            <Sparkles size={17} /> Build it
          </Button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => {
              haptics.tap();
              setAnswers(null);
            }}
            className="flex items-center gap-1 text-[13px] font-semibold text-fg-muted mb-3 -mt-1"
          >
            <ChevronLeft size={15} /> Change answers
          </button>

          <p className="text-sm text-fg-muted leading-relaxed mb-3.5">
            Based on {plan.tpl.name.toLowerCase()}, trimmed to {answers?.days} days
            {plan.added.length > 0 ? ', with extra work where your logs say you need it.' : '.'}
          </p>

          {plan.added.length > 0 && (
            <Card className="mb-3.5 p-3.5">
              <CardLabel>Added for your weak points</CardLabel>
              <div className="space-y-1.5">
                {plan.added.map((a) => (
                  <div key={a.exercise} className="text-[13px] leading-snug">
                    <span className="font-semibold">{a.exercise}</span>
                    <span className="text-fg-muted">
                      {' '}
                      → {a.day}, for {REGIONS[a.region].label.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="space-y-2.5 mb-4">
            {plan.dayList.map((d) => (
              <div key={d.name} className="bg-surface-2 rounded-card p-3.5">
                <div className="font-semibold mb-1.5">{d.name}</div>
                <div className="text-sm text-fg-muted leading-relaxed">
                  {d.exercises.map((x) => x.name).join(' · ')}
                </div>
              </div>
            ))}
          </div>

          {split.length > 0 && (
            <div className="mb-3.5">
              <div className="grid grid-cols-2 gap-2">
                {(['replace', 'append'] as ApplyMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      haptics.select();
                      setMode(m);
                    }}
                    className={cn(
                      'h-11 rounded-card border text-[13px] font-semibold transition-colors',
                      mode === m ? 'border-accent bg-accent-soft text-fg' : 'border-border bg-surface-2 text-fg-muted',
                    )}
                  >
                    {m === 'replace' ? 'Replace my split' : 'Add to my split'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-fg-subtle text-center mt-2">
                {mode === 'replace'
                  ? `Your current ${split.length} day${split.length === 1 ? '' : 's'} will be deleted.`
                  : `Kept alongside your current ${split.length} day${split.length === 1 ? '' : 's'}.`}
              </p>
            </div>
          )}

          <Button
            variant="accent"
            size="lg"
            fullWidth
            onClick={() => {
              applyTemplate(plan.dayList, split.length > 0 ? mode : 'replace');
              haptics.success();
              reset();
            }}
          >
            Use this split
          </Button>
        </div>
      )}
    </Sheet>
  );
}
