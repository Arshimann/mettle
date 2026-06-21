import { motion } from 'framer-motion';
import { ChevronRight, Dumbbell, Flame, Moon, Play, Plus } from 'lucide-react';
import { Button, Card, CardLabel, CountUp } from '../../components/ui';
import { listContainer, listItem, spring } from '../../theme/motion';
import { useStore } from '../../store/useStore';
import { useUI } from '../../store/useUI';
import { computeStreak, sessionVolume } from '../../lib/formulas';
import { nextDay } from '../../lib/training';
import { prettyDate, todayStr, daysBetween } from '../../lib/date';
import { unitLabel } from '../../lib/units';
import { DidYouKnow } from './DidYouKnow';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <Card className="p-4 text-center">
      <CountUp value={value} className="block text-[28px] font-bold tabular leading-none tracking-tight" />
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-subtle mt-1.5">
        {label}
      </div>
    </Card>
  );
}

export function Dashboard() {
  const split = useStore((s) => s.split);
  const history = useStore((s) => s.history);
  const prs = useStore((s) => s.prs);
  const units = useStore((s) => s.settings.units);
  const display = useStore((s) => s.settings.display);
  const stretchEnabled = useStore((s) => s.settings.tabs.stretch);
  const startSession = useStore((s) => s.startSession);
  const navigate = useUI((s) => s.navigate);

  const today = todayStr();
  const thisWeek = history.filter((h) => {
    const d = daysBetween(h.date, today);
    return d >= 0 && d < 7;
  }).length;
  const streak = computeStreak(history);
  const last = history[0];
  const weekVolume = history
    .filter((h) => {
      const d = daysBetween(h.date, today);
      return d >= 0 && d < 7;
    })
    .reduce((v, h) => v + sessionVolume(h.exercises), 0);
  const weekPRs = prs.filter((p) => {
    const d = daysBetween(p.date, today);
    return d >= 0 && d < 7;
  }).length;

  const trainedToday = last?.date === today;
  const up = nextDay(split, history);

  return (
    <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-3.5">
      <motion.div variants={listItem} className="mb-1">
        <p className="text-sm text-fg-muted">{greeting()}</p>
        <h1 className="text-[26px] leading-tight">
          {prettyDate(today) === 'Today' ? "Today's the day." : prettyDate(today)}
        </h1>
      </motion.div>

      {display.streak && streak > 0 && (
        <motion.div variants={listItem}>
          <Card className="flex items-center gap-3.5 p-4">
            <div className="w-11 h-11 rounded-btn bg-accent-soft grid place-items-center text-accent">
              <Flame size={22} fill="currentColor" strokeWidth={0} />
            </div>
            <div>
              <div className="text-xl font-bold tabular leading-none">
                {streak} day{streak === 1 ? '' : 's'}
              </div>
              <div className="text-xs text-fg-muted mt-1">Current streak — keep it alive.</div>
            </div>
          </Card>
        </motion.div>
      )}

      {display.stats && history.length > 0 && (
        <motion.div variants={listItem} className="grid grid-cols-3 gap-3.5">
          <Stat value={history.length} label="Workouts" />
          <Stat value={thisWeek} label="This week" />
          <Stat value={prs.length} label="PRs" />
        </motion.div>
      )}

      {display.weeklyRecap && history.length > 0 && (
        <motion.div variants={listItem}>
          <Card>
            <CardLabel>This week</CardLabel>
            <div className="grid grid-cols-3 gap-3 mt-1.5">
              <div>
                <CountUp value={thisWeek} className="block text-2xl font-bold tabular leading-none" />
                <div className="text-[11px] text-fg-subtle mt-1 font-semibold uppercase tracking-wider">Sessions</div>
              </div>
              <div>
                <CountUp value={Math.round(weekVolume)} className="block text-2xl font-bold tabular leading-none" />
                <div className="text-[11px] text-fg-subtle mt-1 font-semibold uppercase tracking-wider">{unitLabel(units)} vol</div>
              </div>
              <div>
                <CountUp value={weekPRs} className="block text-2xl font-bold tabular leading-none" />
                <div className="text-[11px] text-fg-subtle mt-1 font-semibold uppercase tracking-wider">PRs</div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {display.upNext && split.length > 0 && (
        <motion.div variants={listItem}>
          {trainedToday ? (
            <Card className="flex items-center gap-3.5 p-4">
              <div className="w-11 h-11 rounded-btn bg-accent-soft grid place-items-center text-accent shrink-0">
                <Moon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <CardLabel className="mb-0.5">Today</CardLabel>
                <div className="font-semibold leading-tight">Rest & recover</div>
                <div className="text-xs text-fg-muted mt-0.5">You've trained today — let it rebuild.</div>
              </div>
              {stretchEnabled && (
                <Button size="sm" onClick={() => navigate('stretch')}>
                  Loosen up
                </Button>
              )}
            </Card>
          ) : (
            up && (
              <Card className="flex items-center gap-3.5 p-4">
                <div className="w-11 h-11 rounded-btn bg-accent text-accent-fg grid place-items-center shrink-0">
                  <Play size={20} fill="currentColor" strokeWidth={0} />
                </div>
                <div className="min-w-0 flex-1">
                  <CardLabel className="mb-0.5">Up next</CardLabel>
                  <div className="font-semibold leading-tight truncate">{up.name}</div>
                  <div className="text-xs text-fg-muted mt-0.5">
                    {up.exercises.length} exercise{up.exercises.length === 1 ? '' : 's'}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => {
                    startSession(up);
                    navigate('train');
                  }}
                >
                  Start
                </Button>
              </Card>
            )
          )}
        </motion.div>
      )}

      {split.length === 0 ? (
        <motion.div variants={listItem}>
          <Card className="overflow-hidden">
            <CardLabel>Get started</CardLabel>
            <h2 className="text-xl mb-1.5">Build your split</h2>
            <p className="text-sm text-fg-muted leading-relaxed mb-4">
              Define your training days and the exercises in each. Everything else flows from here.
            </p>
            <Button variant="accent" size="lg" fullWidth onClick={() => navigate('split')}>
              <Plus size={18} /> Set up split
            </Button>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={listItem} className="space-y-3">
          <div className="flex items-center justify-between px-0.5 pt-1">
            <h2 className="text-lg">Your days</h2>
            <button
              onClick={() => navigate('split')}
              className="text-[13px] font-semibold text-fg-muted flex items-center gap-0.5"
            >
              Edit <ChevronRight size={15} />
            </button>
          </div>
          {split.map((day) => (
            <motion.div key={day.id} whileTap={{ scale: 0.99 }} transition={spring}>
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
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => {
                    startSession(day);
                    navigate('train');
                  }}
                >
                  Train
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {display.lastWorkout && last && (
        <motion.div variants={listItem}>
          <Card onClick={() => navigate('progress')} className="cursor-pointer">
            <CardLabel>Last workout</CardLabel>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg truncate">{last.dayName || 'Workout'}</h3>
              <span className="text-xs text-fg-muted shrink-0">{prettyDate(last.date)}</span>
            </div>
            <p className="text-sm text-fg-muted mt-1">
              {last.exercises.length} exercises ·{' '}
              {last.exercises.reduce((n, ex) => n + ex.sets.length, 0)} sets ·{' '}
              {Math.round(sessionVolume(last.exercises)).toLocaleString()} {unitLabel(units)} volume
            </p>
          </Card>
        </motion.div>
      )}

      {display.didYouKnow && (
        <motion.div variants={listItem}>
          <DidYouKnow />
        </motion.div>
      )}
    </motion.div>
  );
}
