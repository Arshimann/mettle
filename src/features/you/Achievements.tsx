import { Card, CardLabel } from '../../components/ui';
import { cn } from '../../lib/cn';
import { useStore } from '../../store/useStore';
import { computeStreak, sessionVolume } from '../../lib/formulas';
import { ACHIEVEMENTS } from '../../data/achievements';

export function Achievements() {
  const history = useStore((s) => s.history);
  const prs = useStore((s) => s.prs);

  const exercises = new Set(history.flatMap((h) => h.exercises.map((e) => e.name.toLowerCase()))).size;
  const volume = history.reduce((v, h) => v + sessionVolume(h.exercises), 0);
  const stats = { workouts: history.length, prs: prs.length, streak: computeStreak(history), exercises, volume };
  const unlocked = ACHIEVEMENTS.filter((a) => a.test(stats)).length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardLabel className="mb-0">Achievements</CardLabel>
        <span className="text-sm text-fg-muted tabular">
          {unlocked}/{ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {ACHIEVEMENTS.map((a) => {
          const got = a.test(stats);
          const Icon = a.icon;
          return (
            <div
              key={a.id}
              className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-btn border',
                got ? 'bg-accent-soft border-accent/40' : 'bg-surface-2 border-border opacity-55',
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-btn grid place-items-center shrink-0',
                  got ? 'bg-accent text-accent-fg' : 'bg-surface text-fg-subtle',
                )}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate">{a.name}</div>
                <div className="text-[11px] text-fg-subtle truncate">{a.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
