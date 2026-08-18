import { useEffect, useState } from 'react';
import { ChevronRight, Flame, Users } from 'lucide-react';
import { Card, CardLabel } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { prettyDate } from '../../lib/date';
import { isSupabaseConfigured } from '../../lib/supabase';
import { fetchFriendsFeed } from '../../lib/social';
import type { FriendWorkout } from '../../types/social';
import { useAuth } from '../../store/useAuth';
import { useSocial } from '../../store/useSocial';
import { useUI } from '../../store/useUI';
import { Avatar } from '../friends/Avatar';
import { PresenceDot } from '../friends/Friends';

/** Who's training now, and what your circle did recently. */
export function FriendActivity() {
  const status = useAuth((s) => s.status);
  const friends = useSocial((s) => s.friends);
  const presence = useSocial((s) => s.presence);
  const ensurePresence = useSocial((s) => s.ensurePresence);
  const navigate = useUI((s) => s.navigate);

  const [feed, setFeed] = useState<FriendWorkout[]>([]);

  useEffect(() => {
    if (status !== 'signed-in' || friends.length === 0) return;
    ensurePresence();
    let stale = false;
    void fetchFriendsFeed(friends.map((f) => f.userId), 5).then((res) => {
      if (!stale && res.ok && res.data) setFeed(res.data);
    });
    return () => {
      stale = true;
    };
  }, [status, friends, ensurePresence]);

  if (!isSupabaseConfigured || status !== 'signed-in' || friends.length === 0) return null;

  const trainingNow = friends.filter((f) => presence[f.userId]?.training);
  const nameOf = (id: string) => friends.find((f) => f.userId === id);

  return (
    <Card className="p-0">
      <button
        onClick={() => {
          haptics.tap();
          navigate('friends');
        }}
        className="w-full text-left p-4"
      >
        <div className="flex items-center justify-between mb-2.5">
          <CardLabel className="mb-0">Your circle</CardLabel>
          <ChevronRight size={16} className="text-fg-subtle" />
        </div>

        {trainingNow.length > 0 ? (
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex -space-x-2">
              {trainingNow.slice(0, 3).map((f) => (
                <div key={f.userId} className="relative">
                  <Avatar name={f.displayName} url={f.avatarUrl} size={30} />
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <PresenceDot online training />
                  </span>
                </div>
              ))}
            </div>
            <span className="text-[13px] font-semibold text-accent">
              {trainingNow.length === 1
                ? `${trainingNow[0].displayName} is training now`
                : `${trainingNow.length} friends training now`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3 text-[13px] text-fg-muted">
            <Users size={15} className="text-fg-subtle" />
            Nobody's mid-workout right now.
          </div>
        )}

        {feed.length > 0 && (
          <div className="space-y-2">
            {feed.slice(0, 3).map((w) => {
              const who = nameOf(w.userId);
              return (
                <div key={w.key} className="flex items-center gap-2.5">
                  <Avatar name={who?.displayName ?? 'Lifter'} url={who?.avatarUrl ?? null} size={26} />
                  <span className="min-w-0 flex-1 text-[13px] truncate">
                    <span className="font-semibold">{who?.displayName ?? 'A friend'}</span>
                    <span className="text-fg-muted"> · {w.dayName}</span>
                  </span>
                  {w.prNames.length > 0 && <Flame size={13} className="text-accent shrink-0" />}
                  <span className="text-[11px] text-fg-subtle shrink-0">{prettyDate(w.date)}</span>
                </div>
              );
            })}
          </div>
        )}
      </button>
    </Card>
  );
}
