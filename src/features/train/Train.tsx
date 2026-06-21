import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Calculator, Check, Dumbbell, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardLabel, EmptyState, PageHeader, Stepper } from '../../components/ui';
import { ExercisePicker } from '../../components/ExercisePicker';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { listContainer, listItem } from '../../theme/motion';
import { useStore, type EndSessionResult } from '../../store/useStore';
import { useUI } from '../../store/useUI';
import { lastPerformance, suggestNextKg } from '../../lib/training';
import { fmtWeight, loadIncrement, unitLabel } from '../../lib/units';
import { fmtDuration } from '../../lib/date';
import { RestTimer } from './RestTimer';
import { FinishSheet } from './FinishSheet';
import { ExerciseTools } from './ExerciseTools';
import { Confetti } from './Confetti';
import type { WarmupSet } from '../../lib/plates';

function Celebration({
  result,
  onDone,
}: {
  result: EndSessionResult;
  onDone: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-canvas flex flex-col items-center justify-center px-8 text-center overflow-hidden">
      <Confetti />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        className="w-20 h-20 rounded-[24px] bg-accent text-accent-fg grid place-items-center mb-6 shadow-pop"
      >
        <Award size={40} />
      </motion.div>
      <h1 className="text-4xl mb-2">New PR!</h1>
      <p className="text-fg-muted mb-1">You set a personal record on</p>
      <p className="text-lg font-semibold mb-8">{result.prHits.join(', ')}</p>
      <Button variant="accent" size="lg" onClick={onDone} className="px-8">
        View progress
      </Button>
    </div>
  );
}

export function Train() {
  const session = useStore((s) => s.activeSession);
  const split = useStore((s) => s.split);
  const history = useStore((s) => s.history);
  const units = useStore((s) => s.settings.units);
  const preferredRest = useStore((s) => s.settings.preferredRest);
  const startSession = useStore((s) => s.startSession);
  const cancelSession = useStore((s) => s.cancelSession);
  const endSession = useStore((s) => s.endSession);
  const update = useStore((s) => s.updateSession);
  const navigate = useUI((s) => s.navigate);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [celebration, setCelebration] = useState<EndSessionResult | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [tools, setTools] = useState<{ ei: number; name: string; target: number } | null>(null);
  const [flashReps, setFlashReps] = useState<{ ei: number; si: number } | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  // ---- celebration overlay (after a PR) ----
  if (celebration) {
    return (
      <Celebration
        result={celebration}
        onDone={() => {
          setCelebration(null);
          navigate('progress');
        }}
      />
    );
  }

  // ---- no active session: pick a day to start ----
  if (!session) {
    return (
      <div>
        <PageHeader title="Train" subtitle="Start a session" />
        {split.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={Dumbbell}
              title="No split yet"
              body="Build your training days first, then start a workout from one of them."
              action={
                <Button variant="accent" onClick={() => navigate('split')}>
                  Build split
                </Button>
              }
            />
          </Card>
        ) : (
          <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-3">
            {split.map((day) => (
              <motion.div key={day.id} variants={listItem}>
                <Card className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-btn bg-surface-2 grid place-items-center text-fg-muted shrink-0">
                    <Dumbbell size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{day.name}</div>
                    <div className="text-xs text-fg-muted truncate">
                      {day.exercises.length} exercise{day.exercises.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <Button size="sm" variant="accent" onClick={() => startSession(day)}>
                    Start
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  // ---- active session: the logger (session is non-null here) ----
  const elapsed = fmtDuration(Math.floor((nowTick - session.startedAt) / 1000));

  const patchSet = (
    ei: number,
    si: number,
    patch: Partial<{ weight: string; reps: string; done: boolean; toFailure: boolean }>,
  ) =>
    update((s) => ({
      ...s,
      exercises: s.exercises.map((ex, i) =>
        i !== ei ? ex : { ...ex, sets: ex.sets.map((st, j) => (j !== si ? st : { ...st, ...patch })) },
      ),
    }));

  const addSet = (ei: number) =>
    update((s) => ({
      ...s,
      exercises: s.exercises.map((ex, i) => {
        if (i !== ei) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return { ...ex, sets: [...ex.sets, { weight: last?.weight ?? '', reps: last?.reps ?? '', done: false }] };
      }),
    }));

  const removeLastSet = (ei: number) =>
    update((s) => ({
      ...s,
      exercises: s.exercises.map((ex, i) =>
        i !== ei || ex.sets.length <= 1 ? ex : { ...ex, sets: ex.sets.slice(0, -1) },
      ),
    }));

  const removeExercise = (ei: number) =>
    update((s) => ({ ...s, exercises: s.exercises.filter((_, i) => i !== ei) }));

  const addExercise = (name: string) =>
    update((s) => ({ ...s, exercises: [...s.exercises, { name, sets: [{ weight: '', reps: '', done: false }] }] }));

  const startRest = (secs: number) =>
    update((s) => ({ ...s, restEndsAt: Date.now() + secs * 1000, restDuration: secs }));

  const addWarmup = (ei: number, sets: WarmupSet[]) =>
    update((s) => ({
      ...s,
      exercises: s.exercises.map((ex, i) =>
        i !== ei
          ? ex
          : {
              ...ex,
              sets: [
                ...sets.map((w) => ({ weight: String(w.weight), reps: String(w.reps), done: false })),
                ...ex.sets,
              ],
            },
      ),
    }));

  const toggleDone = (ei: number, si: number, wPh?: string, rPh?: string) => {
    const cur = session.exercises[ei]?.sets[si];
    if (!cur) return;
    const becameDone = !cur.done;

    // To-failure sets must record the reps you actually hit — never guess them.
    // Block completion and flag the reps field until a number is entered.
    if (becameDone && cur.toFailure && cur.reps.trim() === '') {
      haptics.warn();
      setFlashReps({ ei, si });
      setTimeout(() => setFlashReps((f) => (f && f.ei === ei && f.si === si ? null : f)), 2500);
      return;
    }

    // For normal sets, accept the suggested/last values for any empty field so a
    // quick tap still logs real numbers. F sets keep exactly the reps you typed.
    const fill = (val: string, ph?: string) => (val === '' && ph && ph !== '0' ? ph : val);
    update((s) => ({
      ...s,
      exercises: s.exercises.map((ex, i) =>
        i !== ei
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((st, j) =>
                j !== si
                  ? st
                  : becameDone
                    ? {
                        ...st,
                        done: true,
                        weight: fill(st.weight, wPh),
                        reps: st.toFailure ? st.reps : fill(st.reps, rPh),
                      }
                    : { ...st, done: false },
              ),
            },
      ),
    }));
    if (becameDone) {
      haptics.success();
      setFlashReps((f) => (f && f.ei === ei && f.si === si ? null : f));
      startRest(preferredRest);
    } else {
      haptics.tap();
    }
  };

  const handleConfirmFinish = (meta: { rating?: number; note?: string }) => {
    const result = endSession(meta);
    setFinishOpen(false);
    if (result && result.prHits.length > 0) {
      setCelebration(result);
    } else {
      navigate(result ? 'progress' : 'home');
    }
  };

  return (
    <div>
      <Card className="flex items-center justify-between mb-3.5 py-3.5">
        <div className="min-w-0">
          <CardLabel className="mb-0.5">In progress</CardLabel>
          <h1 className="text-2xl truncate leading-none">{session.dayName}</h1>
          <div className="text-sm text-fg-muted mt-1.5 tabular">{elapsed} elapsed</div>
        </div>
        <Button variant="accent" onClick={() => setFinishOpen(true)}>
          Finish
        </Button>
      </Card>

      <div className="space-y-3">
        {session.exercises.map((ex, ei) => {
          const lp = lastPerformance(history, ex.name);
          const suggestKg = suggestNextKg(history, ex.name, units);
          const weightPlaceholder = suggestKg != null ? String(fmtWeight(suggestKg, units)) : '0';
          const repsPlaceholder = lp ? String(lp.top.reps) : '0';
          const entered = ex.sets.map((s) => parseFloat(s.weight)).filter((n) => !isNaN(n));
          const toolTarget = entered.length
            ? Math.max(...entered)
            : suggestKg != null
              ? Number(fmtWeight(suggestKg, units))
              : 0;
          return (
            <Card key={`${ex.name}-${ei}`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg truncate">{ex.name}</h3>
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => { haptics.tap(); setTools({ ei, name: ex.name, target: toolTarget }); }}
                    className="w-8 h-8 grid place-items-center text-fg-subtle"
                    aria-label={`Tools for ${ex.name}`}
                  >
                    <Calculator size={16} />
                  </button>
                  <button
                    onClick={() => { haptics.tap(); removeExercise(ei); }}
                    className="w-8 h-8 grid place-items-center text-fg-subtle"
                    aria-label={`Remove ${ex.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3 text-[13px]">
                <span className="text-fg-muted">
                  {lp ? `Last · ${fmtWeight(lp.top.weight, units)}${unitLabel(units)} × ${lp.top.reps}` : 'First time'}
                </span>
                {suggestKg != null && (
                  <button
                    onClick={() => {
                      const idx = ex.sets.findIndex((s) => !s.done);
                      if (idx < 0) return;
                      patchSet(ei, idx, { weight: String(fmtWeight(suggestKg, units)), reps: repsPlaceholder });
                      haptics.tap();
                    }}
                    className="ml-auto px-2.5 h-7 rounded-full bg-accent-soft text-accent text-[12px] font-semibold"
                  >
                    Try {fmtWeight(suggestKg, units)}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {ex.sets.map((set, si) => (
                  <div key={si} className="flex items-center gap-1.5">
                    <span className="w-4 text-center text-sm font-bold text-fg-subtle tabular shrink-0">{si + 1}</span>
                    <Stepper
                      value={set.weight}
                      onChange={(v) => patchSet(ei, si, { weight: v })}
                      step={loadIncrement(units)}
                      decimal
                      placeholder={weightPlaceholder}
                      aria-label="Weight"
                      className={set.done ? 'border-accent' : 'border-border'}
                    />
                    <Stepper
                      value={set.reps}
                      onChange={(v) => patchSet(ei, si, { reps: v })}
                      step={1}
                      placeholder={set.toFailure ? 'reps?' : repsPlaceholder}
                      aria-label="Reps"
                      className={cn(
                        flashReps?.ei === ei && flashReps?.si === si
                          ? 'border-danger ring-2 ring-danger/35'
                          : set.done
                            ? 'border-accent'
                            : 'border-border',
                      )}
                    />
                    <button
                      onClick={() => { haptics.tap(); patchSet(ei, si, { toFailure: !set.toFailure }); }}
                      aria-label="To failure"
                      title="To failure"
                      className={cn(
                        'w-9 h-11 rounded-btn grid place-items-center shrink-0 border text-[13px] font-bold transition-colors',
                        set.toFailure ? 'bg-accent-soft border-accent text-accent' : 'bg-surface-2 border-border text-fg-subtle',
                      )}
                    >
                      F
                    </button>
                    <button
                      onClick={() => toggleDone(ei, si, weightPlaceholder, repsPlaceholder)}
                      aria-label="Mark set done"
                      className={cn(
                        'w-10 h-11 rounded-btn grid place-items-center shrink-0 border transition-colors',
                        set.done ? 'bg-accent border-accent text-accent-fg' : 'bg-surface-2 border-border text-fg-subtle',
                      )}
                    >
                      <Check size={18} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => {
                    haptics.tap();
                    addSet(ei);
                  }}
                  className="flex items-center gap-1 text-[13px] font-semibold text-accent"
                >
                  <Plus size={15} /> Add set
                </button>
                {ex.sets.length > 1 && (
                  <button
                    onClick={() => {
                      haptics.tap();
                      removeLastSet(ei);
                    }}
                    className="text-[13px] font-semibold text-fg-subtle"
                  >
                    Remove set
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Button variant="outline" fullWidth className="mt-3" onClick={() => setPickerOpen(true)}>
        <Plus size={16} /> Add exercise
      </Button>

      <Button variant="accent" size="lg" fullWidth className="mt-3" onClick={() => setFinishOpen(true)}>
        Finish workout
      </Button>

      <Button
        variant="danger"
        fullWidth
        className="mt-2.5"
        onClick={() => {
          if (!confirmDiscard) {
            setConfirmDiscard(true);
            setTimeout(() => setConfirmDiscard(false), 3000);
            return;
          }
          haptics.warn();
          cancelSession();
          navigate('home');
        }}
      >
        {confirmDiscard ? 'Tap again to discard' : 'Discard workout'}
      </Button>

      {/* Clearance so the floating rest timer never covers the buttons above. */}
      {session.restEndsAt && <div className="h-28" aria-hidden="true" />}

      <RestTimer />
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
        exclude={session.exercises.map((e) => e.name)}
      />
      <FinishSheet open={finishOpen} onClose={() => setFinishOpen(false)} onConfirm={handleConfirmFinish} />
      <ExerciseTools
        open={!!tools}
        onClose={() => setTools(null)}
        exerciseName={tools?.name ?? ''}
        initialTarget={tools?.target ?? 0}
        units={units}
        onAddWarmup={(sets) => {
          if (tools) addWarmup(tools.ei, sets);
          setTools(null);
        }}
      />
    </div>
  );
}
