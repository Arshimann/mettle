import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Calculator, Check, Dumbbell, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardLabel, EmptyState, PageHeader, Sheet, Stepper } from '../../components/ui';
import { ExercisePicker } from '../../components/ExercisePicker';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { listContainer, listItem } from '../../theme/motion';
import { useStore, type EndSessionResult } from '../../store/useStore';
import { useUI } from '../../store/useUI';
import { lastPerformance, suggestNextKg } from '../../lib/training';
import { distanceLabel, fmtWeight, fromKg, loadIncrement, unitLabel } from '../../lib/units';
import { sessionVolume } from '../../lib/formulas';
import { sfxFanfare, sfxSetDone, sfxSparkle } from '../../lib/sound';
import { quoteForCount } from '../../data/quotes';
import { EXERCISE_LIBRARY } from '../../data/exercises';
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
  const units = useStore((s) => s.settings.units);
  const workoutCount = useStore((s) => s.history.length);
  const quote = quoteForCount(workoutCount);
  const hasPR = result.prHits.length > 0;
  const sets = result.entry.exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const vol = Math.round(fromKg(sessionVolume(result.entry.exercises), units));

  // Fanfare + glitter under the fireworks, once per celebration.
  useEffect(() => {
    sfxFanfare();
    sfxSparkle();
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-canvas flex flex-col items-center justify-center px-8 text-center overflow-hidden">
      <Confetti big={hasPR} />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        className="w-20 h-20 rounded-[24px] bg-accent text-accent-fg grid place-items-center mb-6 shadow-pop"
      >
        {hasPR ? <Award size={40} /> : <Check size={40} strokeWidth={3} />}
      </motion.div>
      <h1 className="text-4xl mb-2">{hasPR ? 'New PR!' : 'Workout complete'}</h1>
      {hasPR ? (
        <>
          <p className="text-fg-muted mb-1">You set a personal record on</p>
          <p className="text-lg font-semibold mb-5">{result.prHits.join(', ')}</p>
        </>
      ) : (
        <p className="text-fg-muted mb-5">{result.entry.dayName || 'Session'} in the books.</p>
      )}

      <div className="flex items-center gap-6 mb-7">
        <div>
          <div className="text-2xl font-bold tabular leading-none">{result.entry.exercises.length}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle mt-1">Exercises</div>
        </div>
        <div>
          <div className="text-2xl font-bold tabular leading-none">{sets}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle mt-1">Sets</div>
        </div>
        <div>
          <div className="text-2xl font-bold tabular leading-none">{vol.toLocaleString()}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle mt-1">{unitLabel(units)} vol</div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="max-w-[24rem] mb-8"
      >
        <p className="text-[15px] leading-relaxed italic">“{quote.text}”</p>
        {quote.by && <p className="text-[12px] text-fg-subtle mt-1.5">— {quote.by}</p>}
      </motion.div>

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
  const autoRest = useStore((s) => s.settings.autoRest);
  const startSession = useStore((s) => s.startSession);
  const cancelSession = useStore((s) => s.cancelSession);
  const endSession = useStore((s) => s.endSession);
  const update = useStore((s) => s.updateSession);
  const navigate = useUI((s) => s.navigate);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [celebration, setCelebration] = useState<EndSessionResult | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [tools, setTools] = useState<{ ei: number; name: string; target: number } | null>(null);
  const [flashReps, setFlashReps] = useState<{ ei: number; si: number } | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Cardio exercises log minutes/distance instead of weight×reps.
  const customExercises = useStore((s) => s.customExercises);
  const cardioNames = useMemo(() => {
    const set = new Set<string>();
    EXERCISE_LIBRARY.forEach((e) => { if (e.group === 'Cardio') set.add(e.name.toLowerCase()); });
    customExercises.forEach((e) => { if (e.group === 'Cardio') set.add(e.name.toLowerCase()); });
    return set;
  }, [customExercises]);

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
    patch: Partial<{ weight: string; reps: string; done: boolean; toFailure: boolean; duration: string; distance: string }>,
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
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              weight: last?.weight ?? '',
              reps: last?.reps ?? '',
              duration: last?.duration ?? '',
              distance: last?.distance ?? '',
              done: false,
            },
          ],
        };
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
    const exercise = session.exercises[ei];
    const cur = exercise?.sets[si];
    if (!cur) return;
    const becameDone = !cur.done;
    const isCardio = cardioNames.has(exercise.name.toLowerCase());

    // Honest logging: cardio needs real minutes, to-failure needs real reps —
    // block completion and flag the field instead of guessing.
    if (becameDone && isCardio && (cur.duration ?? '').trim() === '') {
      haptics.warn();
      setFlashReps({ ei, si });
      setTimeout(() => setFlashReps((f) => (f && f.ei === ei && f.si === si ? null : f)), 2500);
      return;
    }
    if (becameDone && cur.toFailure && cur.reps.trim() === '') {
      haptics.warn();
      setFlashReps({ ei, si });
      setTimeout(() => setFlashReps((f) => (f && f.ei === ei && f.si === si ? null : f)), 2500);
      return;
    }

    // For normal sets, accept the suggested/last values for any empty field so a
    // quick tap still logs real numbers. F sets keep exactly the reps you typed;
    // cardio sets keep exactly the minutes you typed.
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
                    ? isCardio
                      ? { ...st, done: true }
                      : {
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
      sfxSetDone();
      setFlashReps((f) => (f && f.ei === ei && f.si === si ? null : f));
      // No rest countdown after cardio — you're not racking a bar.
      if (autoRest && !isCardio) startRest(preferredRest);
    } else {
      haptics.tap();
    }
  };

  const handleConfirmFinish = (meta: { rating?: number; note?: string }) => {
    const result = endSession(meta);
    setFinishOpen(false);
    // Every saved workout gets the celebration moment — PRs stack on top.
    if (result) setCelebration(result);
    else navigate('home');
  };

  return (
    <div>
      <Card className="flex items-center justify-between mb-3.5 py-3.5">
        <div className="min-w-0">
          <CardLabel className="mb-0.5">In progress</CardLabel>
          <h1 className="text-2xl truncate leading-none">{session.dayName}</h1>
          <div className="text-sm text-fg-muted mt-1.5 tabular">{elapsed} elapsed</div>
        </div>
        <Button variant="accent" onClick={() => { haptics.warn(); setConfirmEnd(true); }}>
          End
        </Button>
      </Card>

      <div className="space-y-3">
        {session.exercises.map((ex, ei) => {
          const isCardio = cardioNames.has(ex.name.toLowerCase());
          const lp = isCardio ? null : lastPerformance(history, ex.name);
          const suggestKg = isCardio ? null : suggestNextKg(history, ex.name, units);
          const weightPlaceholder = suggestKg != null ? String(fmtWeight(suggestKg, units)) : '0';
          // Real last-time reps win; otherwise the planned range from the split.
          const repsPlaceholder = lp ? String(lp.top.reps) : (ex.targetReps ?? '0');
          // Fast-fill may only commit plain numbers — a "8–12" range stays a hint.
          const repsFill = /^\d+(\.\d+)?$/.test(repsPlaceholder) ? repsPlaceholder : undefined;
          // Cardio context line: your longest bout last time this was logged.
          const lastCardioMin = isCardio
            ? (() => {
                for (const h of history) {
                  const e = h.exercises.find((x) => x.name.toLowerCase() === ex.name.toLowerCase());
                  if (e) {
                    const m = Math.max(0, ...e.sets.map((st) => st.durationMin ?? 0));
                    if (m > 0) return m;
                  }
                }
                return null;
              })()
            : null;
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
                  {!isCardio && (
                    <button
                      onClick={() => { haptics.tap(); setTools({ ei, name: ex.name, target: toolTarget }); }}
                      className="w-8 h-8 grid place-items-center text-fg-subtle"
                      aria-label={`Tools for ${ex.name}`}
                    >
                      <Calculator size={16} />
                    </button>
                  )}
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
                  {isCardio
                    ? lastCardioMin
                      ? `Last · ${lastCardioMin} min`
                      : 'First time'
                    : lp
                      ? `Last · ${fmtWeight(lp.top.weight, units)}${unitLabel(units)} × ${lp.top.reps}`
                      : 'First time'}
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
                    {isCardio ? (
                      <>
                        <Stepper
                          value={set.duration ?? ''}
                          onChange={(v) => patchSet(ei, si, { duration: v })}
                          step={5}
                          placeholder={lastCardioMin ? String(lastCardioMin) : 'min'}
                          aria-label="Minutes"
                          className={cn(
                            flashReps?.ei === ei && flashReps?.si === si
                              ? 'border-danger ring-2 ring-danger/35'
                              : set.done
                                ? 'border-accent'
                                : 'border-border',
                          )}
                        />
                        <Stepper
                          value={set.distance ?? ''}
                          onChange={(v) => patchSet(ei, si, { distance: v })}
                          step={0.5}
                          decimal
                          placeholder={distanceLabel(units)}
                          aria-label="Distance"
                          className={set.done ? 'border-accent' : 'border-border'}
                        />
                        <button
                          onClick={() => toggleDone(ei, si)}
                          aria-label="Mark set done"
                          className={cn(
                            'w-10 h-11 rounded-btn grid place-items-center shrink-0 border transition-colors',
                            set.done ? 'bg-accent border-accent text-accent-fg' : 'bg-surface-2 border-border text-fg-subtle',
                          )}
                        >
                          <Check size={18} strokeWidth={3} />
                        </button>
                      </>
                    ) : (
                      <>
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
                      onClick={() => toggleDone(ei, si, weightPlaceholder, repsFill)}
                      aria-label="Mark set done"
                      className={cn(
                        'w-10 h-11 rounded-btn grid place-items-center shrink-0 border transition-colors',
                        set.done ? 'bg-accent border-accent text-accent-fg' : 'bg-surface-2 border-border text-fg-subtle',
                      )}
                    >
                      <Check size={18} strokeWidth={3} />
                    </button>
                      </>
                    )}
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

      <Button variant="accent" size="lg" fullWidth className="mt-3" onClick={() => { haptics.warn(); setConfirmEnd(true); }}>
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
      {/* Both end buttons route through this confirm so nobody ends a session by accident. */}
      <Sheet open={confirmEnd} onClose={() => setConfirmEnd(false)} title="End workout?">
        <p className="text-sm text-fg-muted mb-4 -mt-1">
          {session.exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.done).length, 0)} sets done ·{' '}
          {elapsed} elapsed. You'll rate and save it next.
        </p>
        <div className="space-y-2.5">
          <Button
            variant="accent"
            size="lg"
            fullWidth
            onClick={() => {
              setConfirmEnd(false);
              setFinishOpen(true);
            }}
          >
            End workout
          </Button>
          <Button size="lg" fullWidth onClick={() => setConfirmEnd(false)}>
            Keep training
          </Button>
        </div>
      </Sheet>

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
