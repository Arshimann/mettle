import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Calculator, Check, ChevronRight, Dumbbell, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardLabel, EmptyState, PageHeader, PressableCard, Sheet, Stepper } from '../../components/ui';
import { ExercisePicker } from '../../components/ExercisePicker';
import { EditDaySheet } from './EditDaySheet';
import { StallPrompt } from './StallPrompt';
import { SessionIntro } from './SessionIntro';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { listContainer, listItem, revealBlur, springPop } from '../../theme/motion';
import { useStore, type EndSessionResult } from '../../store/useStore';
import { useSocial } from '../../store/useSocial';
import { useUI } from '../../store/useUI';
import { lastPerformance, suggestNextKg } from '../../lib/training';
import { distanceLabel, fmtWeight, fromKg, loadIncrement, paceLabel, toKm, unitLabel } from '../../lib/units';
import { sessionVolume, stalledExercises } from '../../lib/formulas';
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

  // Fanfare + glitter under the fireworks, once per celebration. Claiming the
  // screen also holds back transient toasts until it's finished.
  useEffect(() => {
    sfxFanfare();
    sfxSparkle();
    useUI.getState().setCinematic(true);
    return () => useUI.getState().setCinematic(false);
  }, []);

  const popIn = {
    hidden: { scale: 0.5, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { type: 'spring' as const, stiffness: 320, damping: 18 } },
  };
  const stat = (value: string | number, label: string) => (
    <motion.div variants={revealBlur}>
      <div className="text-[30px] font-display font-bold tabular leading-none">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-subtle mt-1.5">{label}</div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[70] bg-canvas flex flex-col items-center justify-center px-8 text-center overflow-hidden"
    >
      {/* Accent bloom rising behind the badge — the "light comes up" beat. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1 }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 90% 60% at 50% 28%, var(--accent-soft), transparent 65%)' }}
      />
      <Confetti big={hasPR} />
      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.16, delayChildren: 0.2 } } }}
        initial="hidden"
        animate="show"
        className="relative flex flex-col items-center"
      >
        <motion.div variants={popIn} className="relative mb-6">
          <div
            className="absolute -inset-6 rounded-full opacity-80"
            style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 70%)', filter: 'blur(10px)' }}
          />
          <div className="relative w-20 h-20 rounded-[24px] bg-accent bg-accent-grad text-accent-fg grid place-items-center shadow-hero">
            {hasPR ? <Award size={40} /> : <Check size={40} strokeWidth={3} />}
          </div>
        </motion.div>

        <motion.h1 variants={revealBlur} className="display-hero mb-2">
          {hasPR ? 'New PR!' : 'Workout complete'}
        </motion.h1>

        {hasPR ? (
          <motion.div variants={revealBlur} className="mb-6">
            <p className="text-fg-muted mb-1">You set a personal record on</p>
            <p className="text-lg font-semibold">{result.prHits.join(', ')}</p>
          </motion.div>
        ) : (
          <motion.p variants={revealBlur} className="text-fg-muted mb-6">
            {result.entry.dayName || 'Session'} in the books.
          </motion.p>
        )}

        <div className="flex items-center gap-7 mb-7">
          {stat(result.entry.exercises.length, 'Exercises')}
          {stat(sets, 'Sets')}
          {stat(vol.toLocaleString(), `${unitLabel(units)} vol`)}
        </div>

        <motion.div variants={revealBlur} className="max-w-[24rem] mb-8">
          <p className="text-[15px] leading-relaxed italic">“{quote.text}”</p>
          {quote.by && <p className="text-[12px] text-fg-subtle mt-1.5">— {quote.by}</p>}
        </motion.div>

        <motion.div variants={revealBlur}>
          <Button variant="accent" size="lg" onClick={onDone} className="px-8">
            View progress
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
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
  const setStallReasons = useStore((s) => s.setStallReasons);
  const endSession = useStore((s) => s.endSession);
  const update = useStore((s) => s.updateSession);
  const navigate = useUI((s) => s.navigate);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [celebration, setCelebration] = useState<EndSessionResult | null>(null);
  const [confirmEndDiscard, setConfirmEndDiscard] = useState(false);
  const [editDayId, setEditDayId] = useState<string | null>(null);
  const [pendingStalls, setPendingStalls] = useState<{ entryId: string; names: string[] } | null>(null);
  const [editing, setEditing] = useState(false);
  const [intro, setIntro] = useState<string | null>(null);

  // Long-press opens the day editor without needing edit mode first.
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armLongPress = (dayId: string) => {
    cancelLongPress();
    longPress.current = setTimeout(() => {
      haptics.warn();
      setEditDayId(dayId);
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPress.current) clearTimeout(longPress.current);
    longPress.current = null;
  };
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
          // The stall question waits until after the party — never interrupts it.
          if (!pendingStalls?.names.length) navigate('progress');
        }}
      />
    );
  }

  // ---- "why did this stall?", asked once, after the celebration ----
  if (pendingStalls && pendingStalls.names.length > 0) {
    return (
      <StallPrompt
        exercises={pendingStalls.names}
        onDone={(reasons) => {
          if (Object.keys(reasons).length > 0) setStallReasons(pendingStalls.entryId, reasons);
          setPendingStalls(null);
          navigate('progress');
        }}
      />
    );
  }

  // ---- the moment between tapping Start and the logger ----
  if (intro) {
    return <SessionIntro dayName={intro} onDone={() => setIntro(null)} />;
  }

  // ---- no active session: pick a day to start ----
  if (!session) {
    return (
      <div>
        <PageHeader
          title="Train"
          subtitle={editing ? 'Tap a day to edit it' : 'Start a session'}
          action={
            split.length > 0 ? (
              <Button
                size="sm"
                variant={editing ? 'accent' : 'outline'}
                onClick={() => {
                  haptics.tap();
                  setEditing((v) => !v);
                }}
              >
                {editing ? 'Done' : 'Edit'}
              </Button>
            ) : undefined
          }
        />
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
                {/* One card, two modes. In edit mode the whole row is the
                    target; otherwise a long-press gets you there without the
                    permanent pencil cluttering every row. */}
                <PressableCard
                  onPointerDown={() => !editing && armLongPress(day.id)}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onClick={() => {
                    if (!editing) return;
                    haptics.tap();
                    setEditDayId(day.id);
                  }}
                >
                  <Card
                    className={cn(
                      'flex items-center gap-3 p-4 transition-colors',
                      editing && 'border-accent/50 bg-accent-soft/30',
                    )}
                  >
                    <motion.div
                      animate={editing ? { rotate: [0, -2.5, 2.5, 0] } : { rotate: 0 }}
                      transition={editing ? { repeat: Infinity, duration: 0.55, ease: 'easeInOut' } : undefined}
                      className="w-10 h-10 rounded-btn bg-accent-soft grid place-items-center text-accent shrink-0"
                    >
                      {editing ? <Pencil size={17} /> : <Dumbbell size={18} />}
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{day.name}</div>
                      <div className="text-xs text-fg-muted truncate">
                        {day.exercises.length} exercise{day.exercises.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    {editing ? (
                      <ChevronRight size={18} className="text-accent shrink-0" />
                    ) : (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelLongPress();
                          haptics.success();
                          // The intro takes over while the session spins up.
                          setIntro(day.name);
                          startSession(day);
                        }}
                      >
                        Start
                      </Button>
                    )}
                  </Card>
                </PressableCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        <EditDaySheet day={split.find((d) => d.id === editDayId) ?? null} onClose={() => setEditDayId(null)} />
      </div>
    );
  }

  // ---- active session: the logger (session is non-null here) ----
  // Clamped at zero: nowTick is captured at mount, so a session started a
  // moment later would briefly read negative.
  const elapsed = fmtDuration(Math.max(0, Math.floor((nowTick - session.startedAt) / 1000)));

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
    if (result) {
      // Fire-and-forget: friends see the workout without holding up the party.
      useSocial.getState().publishFinishedWorkout(result.entry, result.prHits);
      // Anything that just set a PR obviously isn't stalled — only ask about
      // the rest, and only about lifts in the session we just saved.
      const logged = new Set(result.entry.exercises.map((e) => e.name.toLowerCase()));
      const prNames = new Set(result.prHits.map((n) => n.toLowerCase()));
      const stalled = stalledExercises(useStore.getState().history, { excludeNames: prNames })
        .filter((n) => logged.has(n.toLowerCase()))
        .slice(0, 3);
      setPendingStalls({ entryId: result.entry.id, names: stalled });
      setCelebration(result);
    } else navigate('home');
  };

  return (
    <div>
      <Card className="mb-3.5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardLabel className="mb-0.5">In progress</CardLabel>
            <h1 className="text-xl truncate leading-tight">{session.dayName}</h1>
          </div>
          <Button variant="accent" onClick={() => { haptics.warn(); setConfirmEnd(true); }}>
            End
          </Button>
        </div>
        <div
          className="text-[34px] font-display font-bold tabular leading-none mt-2.5"
          style={{ fontStretch: '110%' }}
        >
          {elapsed}
        </div>
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
          // Cardio never sets a PR, so give it its own record to chase: the
          // longest single bout and the best pace you've ever held on it.
          const cardioBest = isCardio
            ? history.reduce<{ mins: number; pace: string | null }>(
                (best, h) => {
                  const e = h.exercises.find((x) => x.name.toLowerCase() === ex.name.toLowerCase());
                  if (!e) return best;
                  for (const st of e.sets) {
                    const m = st.durationMin ?? 0;
                    if (m > best.mins) best = { mins: m, pace: paceLabel(m, st.distanceKm ?? 0, units) };
                  }
                  return best;
                },
                { mins: 0, pace: null },
              )
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
                    ? cardioBest && cardioBest.mins > 0
                      ? `Best · ${cardioBest.mins} min${cardioBest.pace ? ` @ ${cardioBest.pace}` : ''}`
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

              {/* Cardio earns a live readout: pace per set, totals for the bout. */}
              {isCardio && (() => {
                const mins = ex.sets.reduce((n, s) => n + (parseFloat(s.duration ?? '') || 0), 0);
                const dist = ex.sets.reduce((n, s) => n + (parseFloat(s.distance ?? '') || 0), 0);
                if (mins <= 0 && dist <= 0) return null;
                const pace = paceLabel(mins, toKm(String(dist), units), units);
                return (
                  <div className="flex items-center gap-2 mb-3 -mt-1">
                    {mins > 0 && (
                      <span className="px-2.5 h-7 rounded-full bg-surface-2 text-[12px] font-semibold text-fg-muted inline-flex items-center">
                        {Math.round(mins)} min
                      </span>
                    )}
                    {dist > 0 && (
                      <span className="px-2.5 h-7 rounded-full bg-surface-2 text-[12px] font-semibold text-fg-muted inline-flex items-center">
                        {Math.round(dist * 100) / 100} {distanceLabel(units)}
                      </span>
                    )}
                    {pace && (
                      <span className="px-2.5 h-7 rounded-full bg-accent-soft text-accent text-[12px] font-bold inline-flex items-center tabular">
                        {pace}
                      </span>
                    )}
                  </div>
                );
              })()}

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
                          max={999}
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
                    {/* The most-repeated action in the app — so it gets a real
                        beat: a ring of light pushing outward as it lands. */}
                    <motion.button
                      onClick={() => toggleDone(ei, si, weightPlaceholder, repsFill)}
                      aria-label="Mark set done"
                      whileTap={{ scale: 0.88 }}
                      transition={springPop}
                      animate={
                        set.done
                          ? {
                              boxShadow: [
                                '0 0 0 0 color-mix(in srgb, var(--accent) 60%, transparent)',
                                '0 0 0 12px rgba(0,0,0,0)',
                              ],
                            }
                          : { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }
                      }
                      className={cn(
                        'w-10 h-11 rounded-btn grid place-items-center shrink-0 border transition-colors',
                        set.done ? 'bg-accent bg-accent-grad border-accent text-accent-fg' : 'bg-surface-2 border-border text-fg-subtle',
                      )}
                    >
                      <motion.span
                        animate={set.done ? { scale: [0.6, 1.25, 1] } : { scale: 1 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      >
                        <Check size={18} strokeWidth={3} />
                      </motion.span>
                    </motion.button>
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

      {/* Discarding lives inside the "End workout?" sheet — one destructive
          path, reached the same way as saving. */}

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
            Save &amp; finish
          </Button>
          <Button size="lg" fullWidth onClick={() => setConfirmEnd(false)}>
            Keep training
          </Button>
          {/* Second tap required — this throws the session away for good. */}
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onClick={() => {
              if (!confirmEndDiscard) {
                setConfirmEndDiscard(true);
                setTimeout(() => setConfirmEndDiscard(false), 3000);
                return;
              }
              haptics.warn();
              cancelSession();
              setConfirmEnd(false);
              navigate('home');
            }}
          >
            {confirmEndDiscard ? 'Tap again — this deletes it' : 'End without saving'}
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
