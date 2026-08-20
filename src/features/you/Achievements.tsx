import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardLabel, Segmented, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { prettyDate } from '../../lib/date';
import { haptics } from '../../lib/haptics';
import { buildAchievementStats } from '../../lib/achievementStats';
import { tapCard } from '../../theme/motion';
import { useStore } from '../../store/useStore';
import { useSocial } from '../../store/useSocial';
import { useUI } from '../../store/useUI';
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS, type AchievementTier } from '../../data/achievements';

const TIER_RING: Record<AchievementTier, string> = {
  bronze: 'border-accent/35',
  silver: 'border-accent/55',
  gold: 'border-accent',
};

const TIER_LABEL: Record<AchievementTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

export function Achievements() {
  const history = useStore((s) => s.history);
  const prs = useStore((s) => s.prs);
  const customExercises = useStore((s) => s.customExercises);
  const achievements = useStore((s) => s.achievements);
  const friends = useSocial((s) => s.friends.length);
  // Set when the unlock toast sends you here.
  const focus = useUI((s) => s.params.focus);

  const [showAll, setShowAll] = useState<'earned' | 'all'>('all');
  const [detail, setDetail] = useState<string | null>(null);
  const card = useRef<HTMLDivElement>(null);

  // Arriving from the unlock toast should land on this card, not the top of You.
  useEffect(() => {
    if (focus !== 'achievements') return;
    const t = setTimeout(() => {
      const top = card.current?.getBoundingClientRect().top;
      if (top == null) return;
      // Land on the top of the card, clear of the fixed header — the card is
      // taller than the screen, so centring it would hide where it starts.
      window.scrollBy({ top: top - 76, behavior: 'smooth' });
    }, 220);
    return () => clearTimeout(t);
  }, [focus]);

  const stats = useMemo(() => {
    const customGroups = new Map(customExercises.map((c) => [c.name.toLowerCase(), c.group]));
    return buildAchievementStats(history, prs, { friends, customGroups });
  }, [history, prs, friends, customExercises]);

  const earnedIds = useMemo(() => ACHIEVEMENTS.filter((a) => a.test(stats)).map((a) => a.id), [stats]);

  // Recording an unlock (and announcing it) is AchievementUnlock's job — it
  // runs app-wide, so an achievement earned mid-workout doesn't wait for a
  // visit to this screen.

  const unlockedAt = useMemo(
    () => new Map(achievements.map((a) => [a.id, a.unlockedAt])),
    [achievements],
  );
  // Once earned, always shown as earned — that's the point of recording it.
  const isEarned = (id: string) => unlockedAt.has(id) || earnedIds.includes(id);
  const total = ACHIEVEMENTS.length;
  const count = ACHIEVEMENTS.filter((a) => isEarned(a.id)).length;

  const open = detail ? ACHIEVEMENTS.find((a) => a.id === detail) : undefined;
  const openWhen = open ? unlockedAt.get(open.id) : undefined;
  const openEarned = open ? isEarned(open.id) : false;

  return (
    <div ref={card}>
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
                      <motion.button
                        key={a.id}
                        whileTap={tapCard}
                        onClick={() => {
                          haptics.tap();
                          setDetail(a.id);
                        }}
                        className={cn(
                          'flex items-center gap-2.5 p-2.5 rounded-btn border text-left w-full',
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
                      </motion.button>
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

      {/* Tile text is clipped to one line, so the full requirement lives here. */}
      <Sheet open={!!open} onClose={() => setDetail(null)} title="Achievement">
        {open && (
          <div className="text-center px-2 -mt-1">
            <div
              className={cn(
                'w-16 h-16 rounded-[20px] grid place-items-center mx-auto mb-3.5',
                openEarned ? 'bg-accent bg-accent-grad text-accent-fg shadow-hero' : 'bg-surface-2 text-fg-subtle border border-border',
              )}
            >
              <open.icon size={30} />
            </div>

            <div className="text-[20px] font-display font-bold leading-tight">{open.name}</div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle mt-1.5">
              {TIER_LABEL[open.tier]} · {open.group}
            </div>

            <p className="text-sm text-fg-muted leading-relaxed mt-4">{open.desc}</p>

            <div
              className={cn(
                'mt-4 rounded-btn border px-3 py-2.5 text-[13px] font-semibold',
                openEarned ? 'bg-accent-soft border-accent/40 text-fg' : 'bg-surface-2 border-border text-fg-muted',
              )}
            >
              {openEarned
                ? openWhen
                  ? `Unlocked ${prettyDate(openWhen.slice(0, 10))}`
                  : 'Unlocked'
                : 'Not yet earned'}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
