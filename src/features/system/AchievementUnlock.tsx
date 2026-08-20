import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { ACHIEVEMENTS } from '../../data/achievements';
import { buildAchievementStats } from '../../lib/achievementStats';
import { haptics } from '../../lib/haptics';
import { sfxAchievement } from '../../lib/sound';
import { springPop } from '../../theme/motion';
import { useSocial } from '../../store/useSocial';
import { useStore } from '../../store/useStore';
import { useUI } from '../../store/useUI';

const SHOW_MS = 6000;

/**
 * Watches for newly earned achievements anywhere in the app and announces them.
 *
 * Previously the check only ran while the You screen was open, so an
 * achievement earned by finishing a workout stayed silent until you happened to
 * scroll past it. This runs app-wide instead.
 *
 * The first pass after mount records what's already earned *without* announcing
 * it — otherwise anyone opening this build for the first time gets a dozen
 * toasts for things they did months ago.
 */
export function AchievementUnlock() {
  const history = useStore((s) => s.history);
  const prs = useStore((s) => s.prs);
  const customExercises = useStore((s) => s.customExercises);
  const friends = useSocial((s) => s.friends.length);

  const id = useUI((s) => s.unlockedQueue[0]);
  const cinematic = useUI((s) => s.cinematic);
  const navigate = useUI((s) => s.navigate);
  const primed = useRef(false);

  const earnedIds = useMemo(() => {
    const customGroups = new Map(customExercises.map((c) => [c.name.toLowerCase(), c.group]));
    const stats = buildAchievementStats(history, prs, { friends, customGroups });
    return ACHIEVEMENTS.filter((a) => a.test(stats)).map((a) => a.id);
  }, [history, prs, friends, customExercises]);

  useEffect(() => {
    const fresh = useStore.getState().unlockAchievements(earnedIds);
    if (!primed.current) {
      // Baseline pass — everything already true is recorded, silently.
      primed.current = true;
      return;
    }
    if (fresh.length === 0) return;
    haptics.success();
    sfxAchievement();
    useUI.getState().pushUnlocked(fresh);
  }, [earnedIds]);

  // Each toast gets its own timer, keyed on the id so a queue drains one by one.
  // The clock doesn't start under a celebration screen — it would run out before
  // anyone saw it.
  useEffect(() => {
    if (!id || cinematic) return;
    const t = setTimeout(() => useUI.getState().shiftUnlocked(), SHOW_MS);
    return () => clearTimeout(t);
  }, [id, cinematic]);

  const achievement = id && !cinematic ? ACHIEVEMENTS.find((a) => a.id === id) : undefined;

  return (
    <div
      className="fixed inset-x-0 bottom-[74px] z-[55] flex justify-center px-4 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <AnimatePresence>
        {achievement && (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={springPop}
            className="pointer-events-auto w-full max-w-[420px] flex items-center gap-3 rounded-card bg-elevated/95 backdrop-blur-xl border border-accent/40 pl-3 pr-1.5 py-2.5 shadow-pop"
          >
            {/* The icon carries the celebration — a slow bloom, not a jolt. */}
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 var(--accent-soft)', '0 0 0 10px rgba(0,0,0,0)'] }}
              transition={{ duration: 1.4, repeat: 2, ease: 'easeOut' }}
              className="w-10 h-10 rounded-btn bg-accent bg-accent-grad text-accent-fg grid place-items-center shrink-0"
            >
              <achievement.icon size={20} />
            </motion.div>

            <button
              onClick={() => {
                haptics.tap();
                useUI.getState().shiftUnlocked();
                navigate('you', { focus: 'achievements' });
              }}
              className="min-w-0 flex-1 text-left"
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                Achievement unlocked
              </div>
              <div className="text-[14px] font-semibold truncate">{achievement.name}</div>
              <div className="text-[11px] text-fg-subtle inline-flex items-center gap-0.5">
                Go to achievements <ChevronRight size={11} />
              </div>
            </button>

            <button
              onClick={() => useUI.getState().shiftUnlocked()}
              aria-label="Dismiss"
              className="w-8 h-8 grid place-items-center text-fg-subtle shrink-0 self-start"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
