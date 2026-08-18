import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, ChevronLeft, Flame, GitCompareArrows, Loader2, Plus, Star, UserMinus } from 'lucide-react';
import { Button, Card, CardLabel } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { listContainer, listItem } from '../../theme/motion';
import { consistencyFromDates } from '../../lib/formulas';
import { fmtWeight, unitLabel } from '../../lib/units';
import {
  addComment,
  clearReaction,
  deleteComment,
  fetchComments,
  fetchFriendProfile,
  fetchFriendWorkouts,
  fetchReactions,
  setReaction,
} from '../../lib/social';
import { useSocial } from '../../store/useSocial';
import { useStore } from '../../store/useStore';
import { EXERCISE_LIBRARY } from '../../data/exercises';
import type { FriendProfileData, FriendWorkout, WorkoutReaction } from '../../types/social';
import { ConsistencyGrid } from '../you/Consistency';
import { Avatar } from './Avatar';
import { PresenceDot } from './Friends';
import { WorkoutSocialCard } from './WorkoutSocialCard';
import { CommentsSheet } from './CommentsSheet';
import { Compare } from './Compare';

const WORKOUT_PAGE = 10;

/** A friend's published profile: streak, calendar, workouts, PRs, movements. */
export function FriendProfile({ friendId, onBack }: { friendId: string; onBack: () => void }) {
  const myId = useSocial((s) => s.userId);
  const myShared = useSocial((s) => s.myShared);
  const friends = useSocial((s) => s.friends);
  const presence = useSocial((s) => s.presence);
  const unfriend = useSocial((s) => s.unfriend);

  const units = useStore((s) => s.settings.units);
  const customExercises = useStore((s) => s.customExercises);
  const addCustomExercise = useStore((s) => s.addCustomExercise);

  const [profile, setProfile] = useState<FriendProfileData | null>(null);
  const [workouts, setWorkouts] = useState<FriendWorkout[]>([]);
  const [reactions, setReactions] = useState<WorkoutReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState(WORKOUT_PAGE);
  const [comparing, setComparing] = useState(false);
  const [commentsKey, setCommentsKey] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadReactions = useCallback(
    async (keys: string[]) => {
      const res = await fetchReactions(friendId, keys);
      if (res.ok && res.data) setReactions(res.data);
    },
    [friendId],
  );

  // Parent keys this component by friendId, so initial state is always fresh
  // and every setState here happens after an await (no sync effect updates).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [p, w] = await Promise.all([fetchFriendProfile(friendId), fetchFriendWorkouts(friendId, 20)]);
      if (cancelled) return;
      if (!p.ok || !p.data) {
        setError(p.message ?? 'Could not load this profile');
        setLoading(false);
        return;
      }
      setProfile(p.data);
      const list = w.ok && w.data ? w.data : [];
      setWorkouts(list);
      setLoading(false);
      void loadReactions(list.map((x) => x.key));
    })();
    return () => {
      cancelled = true;
    };
  }, [friendId, loadReactions]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const knownNames = useMemo(() => {
    const set = new Set(EXERCISE_LIBRARY.map((e) => e.name.toLowerCase()));
    customExercises.forEach((e) => set.add(e.name.toLowerCase()));
    return set;
  }, [customExercises]);

  const names = useMemo(() => {
    const map = new Map<string, { displayName: string; avatarUrl: string | null }>();
    for (const f of friends) map.set(f.userId, { displayName: f.displayName, avatarUrl: f.avatarUrl });
    if (myId && myShared?.displayName) {
      map.set(myId, { displayName: `${myShared.displayName} (you)`, avatarUrl: myShared.avatarUrl });
    }
    if (profile) map.set(profile.userId, { displayName: profile.displayName, avatarUrl: profile.avatarUrl });
    return map;
  }, [friends, myId, myShared, profile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-fg-muted">
        <Loader2 size={26} className="animate-spin mb-3" />
      </div>
    );
  }

  if (error || !profile || !myId) {
    return (
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-fg font-semibold mb-4">
          <ChevronLeft size={20} /> Friends
        </button>
        <Card>
          <p className="text-sm text-fg-muted">{error ?? 'Could not load this profile.'}</p>
        </Card>
      </div>
    );
  }

  if (comparing) {
    return <Compare profile={profile} workouts={workouts} onBack={() => setComparing(false)} />;
  }

  const p = presence[friendId];
  const consist = consistencyFromDates(profile.trainedDates, 12);
  const topPRs = [...profile.prs].sort((a, b) => b.weight - a.weight).slice(0, 6);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-fg font-semibold mb-4">
        <ChevronLeft size={20} /> Friends
      </button>

      <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-3.5">
        {/* header */}
        <motion.div variants={listItem}>
          <Card className="relative overflow-hidden p-5">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 130% at 12% 0%, var(--accent-soft), transparent 60%)' }}
            />
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <Avatar name={profile.displayName} url={profile.avatarUrl} size={64} />
                <span className="absolute -bottom-0.5 -right-0.5">
                  <PresenceDot online={Boolean(p?.online)} training={Boolean(p?.training)} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-[22px] leading-tight truncate">{profile.displayName}</h1>
                <div className="text-xs text-fg-muted mt-0.5">
                  {p?.training ? (
                    <span className="text-accent font-semibold">Training right now</span>
                  ) : p?.online ? (
                    'Online'
                  ) : (
                    'Offline'
                  )}
                </div>
              </div>
              {profile.streak > 0 && (
                <div className="text-center shrink-0">
                  <div className="flex items-center gap-1 text-accent justify-center">
                    <Flame size={18} fill="currentColor" strokeWidth={0} />
                    <span className="stat-xl text-[30px]">{profile.streak}</span>
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-subtle mt-0.5">
                    streak
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="surface"
              size="sm"
              className="relative mt-4"
              fullWidth
              onClick={() => setComparing(true)}
            >
              <GitCompareArrows size={15} /> Compare progress
            </Button>
          </Card>
        </motion.div>

        {/* consistency */}
        <motion.div variants={listItem}>
          <Card>
            <CardLabel>Consistency · 12 weeks</CardLabel>
            <div className="mt-2">
              <ConsistencyGrid grid={consist.grid} />
            </div>
          </Card>
        </motion.div>

        {/* PRs */}
        {topPRs.length > 0 && (
          <motion.div variants={listItem}>
            <Card>
              <CardLabel>Personal records</CardLabel>
              <div className="divide-y divide-border">
                {topPRs.map((pr) => (
                  <div key={pr.exercise} className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-0">
                    <Award size={16} className="text-accent shrink-0" />
                    <span className="min-w-0 flex-1 font-medium text-[14px] truncate">{pr.exercise}</span>
                    <span className="text-[14px] font-bold tabular shrink-0">
                      {fmtWeight(pr.weight, units)}
                      {unitLabel(units)} × {pr.reps}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* custom movements */}
        {profile.customExercises.length > 0 && (
          <motion.div variants={listItem}>
            <Card>
              <CardLabel>Their custom movements</CardLabel>
              <div className="divide-y divide-border">
                {profile.customExercises.map((ex) => {
                  const known = knownNames.has(ex.name.toLowerCase());
                  return (
                    <div key={ex.name} className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-0">
                      <Star size={15} className="text-accent shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[14px] truncate">{ex.name}</div>
                        <div className="text-[11px] text-fg-subtle">{ex.group}</div>
                      </div>
                      {known ? (
                        <span className="text-[12px] font-semibold text-fg-subtle shrink-0">In your library</span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            haptics.success();
                            addCustomExercise({ name: ex.name, group: ex.group });
                            // addCustomExercise silently de-dupes — report honestly.
                            const nowKnown =
                              useStore.getState().customExercises.some((c) => c.name.toLowerCase() === ex.name.toLowerCase()) ||
                              EXERCISE_LIBRARY.some((c) => c.name.toLowerCase() === ex.name.toLowerCase());
                            flash(nowKnown ? `Added ${ex.name} to your library` : 'Already in your library');
                          }}
                        >
                          <Plus size={14} /> Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* recent workouts */}
        {workouts.length > 0 ? (
          <motion.div variants={listItem} className="space-y-2.5">
            <CardLabel className="mb-0 px-0.5">Recent workouts</CardLabel>
            {workouts.slice(0, shown).map((w) => (
              <WorkoutSocialCard
                key={w.key}
                workout={w}
                units={units}
                myId={myId}
                reactions={reactions.filter((r) => r.workoutKey === w.key)}
                onReact={(emoji) => {
                  void (emoji ? setReaction(friendId, w.key, myId, emoji) : clearReaction(friendId, w.key, myId)).then(
                    () => loadReactions(workouts.map((x) => x.key)),
                  );
                }}
                onOpenComments={() => setCommentsKey(w.key)}
              />
            ))}
            {workouts.length > shown && (
              <Button fullWidth onClick={() => setShown((n) => n + WORKOUT_PAGE)}>
                Show more
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div variants={listItem}>
            <Card>
              <p className="text-sm text-fg-muted">No workouts shared yet.</p>
            </Card>
          </motion.div>
        )}

        {/* remove */}
        <motion.div variants={listItem}>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              if (!confirmRemove) {
                setConfirmRemove(true);
                setTimeout(() => setConfirmRemove(false), 3000);
                return;
              }
              haptics.warn();
              void unfriend(friendId).then(onBack);
            }}
          >
            <UserMinus size={16} /> {confirmRemove ? 'Tap again to remove' : `Remove ${profile.displayName}`}
          </Button>
        </motion.div>
      </motion.div>

      {commentsKey && (
        <CommentsSheet
          key={commentsKey}
          open
          onClose={() => setCommentsKey(null)}
          myId={myId}
          names={names}
          api={{
            list: () => fetchComments(friendId, commentsKey),
            add: (authorId, body) => addComment(friendId, commentsKey, authorId, body),
            remove: (id) => deleteComment(id),
          }}
        />
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[100px] z-50 bg-fg text-canvas text-sm font-medium px-4 py-2.5 rounded-btn shadow-pop">
          {toast}
        </div>
      )}
    </div>
  );
}
