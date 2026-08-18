import { useEffect, useMemo, useState } from 'react';
import { Card, CardLabel, Segmented } from '../../components/ui';
import { cn } from '../../lib/cn';
import { prettyDate } from '../../lib/date';
import { buildAchievementStats } from '../../lib/achievementStats';
import { useStore } from '../../store/useStore';
import { useSocial } from '../../store/useSocial';
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS, type AchievementTier } from '../../data/achievements';

const TIER_RING: Record<AchievementTier, string> = {
  bronze: 'border-accent/35',
  silver: 'border-accent/55',
  gold: 'border-accent',
};

export function Achievements() {
  const history = useStore((s) => s.history);
  const prs = useStore((s) => s.prs);
  const customExercises = useStore((s) => s.customExercises);
  const achievements = useStore((s) => s.achievements);
  const unlockAchievements = useStore((s) => s.unlockAchievements);
  const friends = useSocial((s) => s.friends.length);

  const [showAll, setShowAll] = useState<'earned' | 'all'>('all');

  const stats = useMemo(() => {
    const customGroups = new Map(customExercises.map((c) => [c.name.toLowerCase(), c.group]));
    return buildAchievementStats(history, prs, { friends, customGroups });
  }, [history, prs, friends, customExercises]);

  const earnedIds = useMemo(() => ACHIEVEMENTS.filter((a) => a.test(stats)).map((a) => a.id), [stats]);

  // Record anything newly earned so it keeps its unlock date, even if the
  // underlying number later drops (a streak breaks, a friend is removed).
  useEffect(() => {
    unlockAchievements(earnedIds);
  }, [earnedIds, unlockAchievements]);

  const unlockedAt = useMemo(
    () => new Map(achievements.map((a) => [a.id, a.unlockedAt])),
    [achievements],
  );
  // Once earned, always shown as earned — that's the point of recording it.
  const isEarned = (id: string) => unlockedAt.has(id) || earnedIds.includes(id);
  const total = ACHIEVEMENTS.length;
  const count = ACHIEVEMENTS.filter((a) => isEarned(a.id)).length;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardLabel className="mb-0">Achievements</CardLabel>
        <span className="text-sm text-fg-muted tabular">
          {count}/{total}
        </span>
      </div>

      <div className="h-2 rounded-full bg-surface-2 overflow-hidden mb-3.5">
        <div
          className="h-full rounded-full bg-accent bg-accent-grad transition-[width] duration-700"
          style={{ width: `${Math.round((count / total) * 100)}%` }}
        />
      </div>

      <Segmented
        fullWidth
        value={showAll}
        onChange={setShowAll}
        options={[
          { value: 'all' as const, label: 'All' },
          { value: 'earned' as const, label: `Earned (${count})` },
        ]}
      />

      <div className="mt-4 space-y-4">
        {ACHIEVEMENT_GROUPS.map((group) => {
          const list = ACHIEVEMENTS.filter(
            (a) => a.group === group && (showAll === 'all' || isEarned(a.id)),
          );
          if (list.length === 0) return null;
          return (
            <div key={group}>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle mb-2 px-0.5">
                {group}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {list.map((a) => {
                  const got = isEarned(a.id);
                  const when = unlockedAt.get(a.id);
                  const Icon = a.icon;
                  return (
                    <div
                      key={a.id}
                      title={got && when ? `Unlocked ${prettyDate(when.slice(0, 10))}` : a.desc}
                      className={cn(
                        'flex items-center gap-2.5 p-2.5 rounded-btn border',
                        got ? cn('bg-accent-soft', TIER_RING[a.tier]) : 'bg-surface-2 border-border opacity-55',
                      )}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-btn grid place-items-center shrink-0',
                          got ? 'bg-accent bg-accent-grad text-accent-fg' : 'bg-surface text-fg-subtle',
                        )}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold truncate">{a.name}</div>
                        <div className="text-[11px] text-fg-subtle truncate">
                          {got && when ? prettyDate(when.slice(0, 10)) : a.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {showAll === 'earned' && count === 0 && (
          <p className="text-sm text-fg-muted text-center py-4">
            Nothing earned yet — log a workout and the first one lands immediately.
          </p>
        )}
      </div>
    </Card>
  );
}
