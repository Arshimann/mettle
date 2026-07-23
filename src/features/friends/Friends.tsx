import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Flame, Loader2, UserPlus, Users, WifiOff, X } from 'lucide-react';
import { Button, Card, CardLabel, EmptyState, PageHeader } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { sfxPop } from '../../lib/sound';
import { listContainer, listItem, springPop } from '../../theme/motion';
import { useAuth } from '../../store/useAuth';
import { useSocial } from '../../store/useSocial';
import { useUI } from '../../store/useUI';
import { AuthPanel } from '../auth/AuthPanel';
import { Avatar } from './Avatar';
import { AddFriendSheet } from './AddFriendSheet';
import { FriendProfile } from './FriendProfile';

/** Presence dot: green = online, pulsing accent = mid-workout. */
export function PresenceDot({ online, training }: { online: boolean; training: boolean }) {
  if (!online) return null;
  return (
    <span className="relative inline-flex w-2.5 h-2.5">
      {training && (
        <span className="absolute inline-flex w-full h-full rounded-full bg-accent opacity-60 animate-ping" />
      )}
      <span className={cn('relative inline-flex w-2.5 h-2.5 rounded-full', training ? 'bg-accent' : 'bg-success')} />
    </span>
  );
}

function ProfileSetup() {
  const setDisplayName = useSocial((s) => s.setDisplayName);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await setDisplayName(name);
    setBusy(false);
    if (!res.ok) {
      haptics.warn();
      setError(res.message ?? 'Could not save that name');
    } else {
      haptics.success();
    }
  };

  return (
    <Card>
      <CardLabel>One last thing</CardLabel>
      <h2 className="text-xl mb-1.5">Pick a display name</h2>
      <p className="text-sm text-fg-muted leading-relaxed mb-4">
        This is how friends find you and see you. You can change it later in Settings.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void save();
        }}
        placeholder="Display name"
        maxLength={24}
        aria-label="Display name"
        className="w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong"
      />
      {error && <p className="text-[13px] text-danger mt-2 leading-snug">{error}</p>}
      <Button
        variant="accent"
        size="lg"
        fullWidth
        className="mt-3.5"
        disabled={name.trim().length < 2 || busy}
        onClick={() => void save()}
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : 'Save name'}
      </Button>
    </Card>
  );
}

export function Friends() {
  const status = useAuth((s) => s.status);
  const ready = useSocial((s) => s.ready);
  const loading = useSocial((s) => s.loading);
  const error = useSocial((s) => s.error);
  const myShared = useSocial((s) => s.myShared);
  const friends = useSocial((s) => s.friends);
  const requestsIn = useSocial((s) => s.requestsIn);
  const presence = useSocial((s) => s.presence);
  const refresh = useSocial((s) => s.refresh);
  const ensurePresence = useSocial((s) => s.ensurePresence);
  const accept = useSocial((s) => s.accept);
  const declineOrCancel = useSocial((s) => s.declineOrCancel);

  const navigate = useUI((s) => s.navigate);
  const friendParam = useUI((s) => s.params.friend) as string | undefined;

  const [addOpen, setAddOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const signedIn = status === 'signed-in';
  useEffect(() => {
    if (signedIn && ready) {
      ensurePresence();
      void refresh();
    }
  }, [signedIn, ready, ensurePresence, refresh]);

  // ---- a friend's profile (params.friend) ----
  if (friendParam) {
    return <FriendProfile key={friendParam} friendId={friendParam} onBack={() => navigate('friends')} />;
  }

  // ---- signed out: the pitch ----
  if (!signedIn) {
    return (
      <div>
        <PageHeader title="Friends" subtitle="Train together, stay accountable" />
        <Card className="mb-3.5">
          <div className="w-12 h-12 rounded-card bg-accent-soft grid place-items-center text-accent mb-4">
            <Users size={24} />
          </div>
          <h2 className="text-xl mb-1.5">Lifting is better with friends</h2>
          <p className="text-sm text-fg-muted leading-relaxed">
            See who's training right now, react to each other's workouts, compare progress, and
            borrow movements from their library. Sign in to unlock it.
          </p>
        </Card>
        <Card>
          <AuthPanel />
        </Card>
      </div>
    );
  }

  if (!ready || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-fg-muted">
        <Loader2 size={26} className="animate-spin mb-3" />
        <p className="text-sm">Loading your circle…</p>
      </div>
    );
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return (
      <div>
        <PageHeader title="Friends" />
        <Card className="p-0">
          <EmptyState
            icon={WifiOff}
            title="You're offline"
            body="Friends need a connection. Your own training keeps working — everything syncs when you're back."
          />
        </Card>
      </div>
    );
  }

  if (!myShared?.displayName) {
    return (
      <div>
        <PageHeader title="Friends" subtitle="Set up your profile" />
        {error && <p className="text-[13px] text-danger mb-3">{error}</p>}
        <ProfileSetup />
      </div>
    );
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(myShared.shareCode);
      setCopied(true);
      haptics.success();
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — code is visible to copy by hand */
    }
  };

  return (
    <div>
      <PageHeader
        title="Friends"
        subtitle={friends.length === 0 ? 'Build your circle' : `${friends.length} in your circle`}
        action={
          <Button size="sm" variant="accent" onClick={() => setAddOpen(true)}>
            <UserPlus size={16} /> Add
          </Button>
        }
      />

      <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-3.5">
        {/* my share code */}
        <motion.div variants={listItem}>
          <Card className="flex items-center gap-3.5 p-4">
            <Avatar name={myShared.displayName} url={myShared.avatarUrl} size={40} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{myShared.displayName}</div>
              <div className="text-xs text-fg-muted mt-0.5">
                Your code: <span className="font-bold tracking-[0.14em] text-fg tabular">{myShared.shareCode}</span>
              </div>
            </div>
            <button
              onClick={() => void copyCode()}
              aria-label="Copy share code"
              className="w-9 h-9 grid place-items-center rounded-btn bg-surface-2 text-fg-muted"
            >
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            </button>
          </Card>
        </motion.div>

        {/* incoming requests */}
        {requestsIn.length > 0 && (
          <motion.div variants={listItem} className="space-y-2.5">
            <CardLabel className="mb-0 px-0.5">Friend requests</CardLabel>
            {requestsIn.map((r) => (
              <Card key={r.id} className="flex items-center gap-3 p-4">
                <Avatar name={r.displayName} url={r.avatarUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{r.displayName}</div>
                  <div className="text-xs text-fg-muted mt-0.5">wants to be friends</div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  transition={springPop}
                  onClick={() => {
                    haptics.success();
                    sfxPop();
                    void accept(r.id);
                  }}
                  aria-label={`Accept ${r.displayName}`}
                  className="w-10 h-10 rounded-full bg-accent bg-accent-grad text-accent-fg grid place-items-center glow-accent"
                >
                  <Check size={18} strokeWidth={3} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  transition={springPop}
                  onClick={() => {
                    haptics.tap();
                    void declineOrCancel(r.id);
                  }}
                  aria-label={`Decline ${r.displayName}`}
                  className="w-10 h-10 rounded-full bg-surface-2 border border-border text-fg-muted grid place-items-center"
                >
                  <X size={18} />
                </motion.button>
              </Card>
            ))}
          </motion.div>
        )}

        {/* friend list */}
        {friends.length === 0 ? (
          <motion.div variants={listItem}>
            <Card className="p-0">
              <EmptyState
                icon={Users}
                title="No friends yet"
                body="Share your code, or add theirs — then their training shows up right here."
                action={
                  <Button variant="accent" onClick={() => setAddOpen(true)}>
                    <UserPlus size={16} /> Add a friend
                  </Button>
                }
              />
            </Card>
          </motion.div>
        ) : (
          friends.map((f) => {
            const p = presence[f.userId];
            return (
              <motion.div key={f.userId} variants={listItem}>
                <Card
                  className="flex items-center gap-3.5 p-4 cursor-pointer"
                  onClick={() => {
                    haptics.tap();
                    navigate('friends', { friend: f.userId });
                  }}
                >
                  <div className="relative">
                    <Avatar name={f.displayName} url={f.avatarUrl} size={44} />
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <PresenceDot online={Boolean(p?.online)} training={Boolean(p?.training)} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{f.displayName}</div>
                    <div className="text-xs text-fg-muted mt-0.5">
                      {p?.training ? (
                        <span className="text-accent font-semibold">Training now</span>
                      ) : p?.online ? (
                        'Online'
                      ) : (
                        'Offline'
                      )}
                    </div>
                  </div>
                  {f.streak > 0 && (
                    <div className="flex items-center gap-1 text-accent shrink-0">
                      <Flame size={16} fill="currentColor" strokeWidth={0} />
                      <span className="text-sm font-bold tabular">{f.streak}</span>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      <AddFriendSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
