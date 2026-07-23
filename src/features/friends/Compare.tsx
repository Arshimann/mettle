import { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Card, CardLabel, EmptyState } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { bestE1RM, consistencyFromDates, consistency } from '../../lib/formulas';
import { fmtWeight, fromKg, unitLabel } from '../../lib/units';
import { prettyDate } from '../../lib/date';
import { useStore } from '../../store/useStore';
import { useSocial } from '../../store/useSocial';
import { LineChart, type ChartPoint } from '../progress/LineChart';
import { ConsistencyGrid } from '../you/Consistency';
import { GitCompareArrows } from 'lucide-react';
import type { FriendProfileData, FriendWorkout } from '../../types/social';

/** Best e1RM per session for one exercise name, oldest → newest. */
function seriesFor(
  sessions: { date: string; exercises: { name: string; sets: { weight: number; reps: number }[] }[] }[],
  exercise: string,
  units: 'kg' | 'lbs',
): ChartPoint[] {
  const lower = exercise.toLowerCase();
  const pts: ChartPoint[] = [];
  for (const s of [...sessions].reverse()) {
    const ex = s.exercises.find((e) => e.name.toLowerCase() === lower);
    if (!ex) continue;
    const e1 = bestE1RM(ex.sets);
    if (e1 > 0) pts.push({ value: Math.round(fromKg(e1, units) * 10) / 10, label: prettyDate(s.date) });
  }
  return pts;
}

/** Side-by-side progression: my e1RM trend vs a friend's, plus both calendars. */
export function Compare({
  profile,
  workouts,
  onBack,
}: {
  profile: FriendProfileData;
  workouts: FriendWorkout[];
  onBack: () => void;
}) {
  const history = useStore((s) => s.history);
  const units = useStore((s) => s.settings.units);
  const myName = useSocial((s) => s.myShared?.displayName) ?? 'You';

  // Exercises both of us have logged (case-insensitive name intersection).
  const shared = useMemo(() => {
    const mine = new Map<string, string>();
    for (const h of history) for (const ex of h.exercises) mine.set(ex.name.toLowerCase(), ex.name);
    const theirs = new Set<string>();
    for (const w of workouts) for (const ex of w.exercises) theirs.add(ex.name.toLowerCase());
    return [...mine.entries()]
      .filter(([lower]) => theirs.has(lower))
      .map(([, name]) => name)
      .sort((a, b) => a.localeCompare(b));
  }, [history, workouts]);

  const [exercise, setExercise] = useState<string | null>(shared[0] ?? null);

  const mySeries = exercise ? seriesFor(history, exercise, units) : [];
  const theirSeries = exercise ? seriesFor(workouts, exercise, units) : [];
  const fmt = (v: number) => `${fmtWeight(v, units)}${unitLabel(units)}`;
  const myBest = mySeries.reduce((m, p) => Math.max(m, p.value), 0);
  const theirBest = theirSeries.reduce((m, p) => Math.max(m, p.value), 0);

  const myConsist = consistency(history, 12);
  const theirConsist = consistencyFromDates(profile.trainedDates, 12);

  return (
    <div>
      <button onClick={() => { haptics.tap(); onBack(); }} className="flex items-center gap-1 text-fg font-semibold mb-4">
        <ChevronLeft size={20} /> {profile.displayName}
      </button>

      <div className="space-y-3.5">
        {shared.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={GitCompareArrows}
              title="Nothing to compare yet"
              body={`You and ${profile.displayName} haven't logged any of the same exercises (in their recent shared workouts).`}
            />
          </Card>
        ) : (
          <>
            {/* exercise picker */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-0.5 px-0.5 pb-1">
              {shared.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    haptics.select();
                    setExercise(name);
                  }}
                  className={cn(
                    'shrink-0 h-9 px-3.5 rounded-full border text-[13px] font-semibold transition-colors whitespace-nowrap',
                    exercise === name
                      ? 'border-accent bg-accent-soft text-fg'
                      : 'border-border bg-surface-2 text-fg-muted',
                  )}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* my trend */}
            <Card>
              <div className="flex items-baseline justify-between">
                <CardLabel>{myName} · est. 1RM</CardLabel>
                {myBest > 0 && (
                  <span className="text-[13px] font-bold tabular text-accent">best {fmt(myBest)}</span>
                )}
              </div>
              {mySeries.length >= 2 ? (
                <LineChart data={mySeries} format={fmt} />
              ) : (
                <p className="text-sm text-fg-muted py-4">
                  {mySeries.length === 1 ? 'One session logged — need two for a trend.' : `You haven't logged ${exercise} yet.`}
                </p>
              )}
            </Card>

            {/* their trend */}
            <Card>
              <div className="flex items-baseline justify-between">
                <CardLabel>{profile.displayName} · est. 1RM</CardLabel>
                {theirBest > 0 && (
                  <span className="text-[13px] font-bold tabular text-accent">best {fmt(theirBest)}</span>
                )}
              </div>
              {theirSeries.length >= 2 ? (
                <LineChart data={theirSeries} format={fmt} />
              ) : (
                <p className="text-sm text-fg-muted py-4">
                  Not enough shared sessions of {exercise} for a trend.
                </p>
              )}
            </Card>
          </>
        )}

        {/* calendars */}
        <Card>
          <div className="flex items-baseline justify-between mb-2">
            <CardLabel className="mb-0">{myName} · consistency</CardLabel>
            <span className="text-[13px] font-bold tabular text-accent">{myConsist.pct}%</span>
          </div>
          <ConsistencyGrid grid={myConsist.grid} />
        </Card>
        <Card>
          <div className="flex items-baseline justify-between mb-2">
            <CardLabel className="mb-0">{profile.displayName} · consistency</CardLabel>
            <span className="text-[13px] font-bold tabular text-accent">{theirConsist.pct}%</span>
          </div>
          <ConsistencyGrid grid={theirConsist.grid} />
        </Card>
      </div>
    </div>
  );
}
