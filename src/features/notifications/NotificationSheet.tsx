import { BellOff, Dumbbell, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { EmptyState, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { prettyDate } from '../../lib/date';
import { useNotifications } from '../../store/useNotifications';
import { useSocial } from '../../store/useSocial';
import { useUI } from '../../store/useUI';
import type { AppNotification, NotificationKind } from '../../lib/notifications';
import { Avatar } from '../friends/Avatar';

const ICON: Record<NotificationKind, typeof Heart> = {
  reaction: Heart,
  comment: MessageCircle,
  'friend-request': UserPlus,
  'friend-training': Dumbbell,
  'physique-reaction': Heart,
  'physique-comment': MessageCircle,
};

function line(n: AppNotification): string {
  switch (n.kind) {
    case 'reaction':
      return `reacted ${n.preview ?? ''} to ${n.subjectLabel ?? 'your workout'}`;
    case 'comment':
      return `commented on ${n.subjectLabel ?? 'your workout'}`;
    case 'friend-request':
      return 'wants to be friends';
    case 'friend-training':
      return 'started training';
    case 'physique-reaction':
      return `reacted ${n.preview ?? ''} to your check-in`;
    case 'physique-comment':
      return 'commented on your check-in';
  }
}

/** Reactions, comments, requests, and friends starting a session. */
export function NotificationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useNotifications((s) => s.items);
  const live = useNotifications((s) => s.live);
  const refresh = useSocial((s) => s.refresh);
  const navigate = useUI((s) => s.navigate);

  const openItem = (n: AppNotification) => {
    haptics.tap();
    onClose();
    if (n.kind === 'friend-request') {
      void refresh();
      navigate('friends');
    } else if (n.kind === 'friend-training') {
      navigate('friends', { friend: n.actorId });
    } else if (n.kind === 'physique-reaction' || n.kind === 'physique-comment') {
      navigate('friends');
    } else {
      // Reactions and comments are on MY workout — Progress is where it lives.
      navigate('progress');
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Notifications">
      {items.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Nothing new"
          body="Reactions, comments, friend requests and who's training will land here."
        />
      ) : (
        <div className="space-y-1.5">
          {items.map((n) => {
            const Icon = ICON[n.kind];
            return (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 rounded-card text-left transition-colors',
                  n.read ? 'bg-transparent' : 'bg-accent-soft',
                )}
              >
                <div className="relative shrink-0">
                  <Avatar name={n.actorName} url={n.actorAvatar} size={36} />
                  <span className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full bg-surface border border-border grid place-items-center text-accent">
                    <Icon size={10} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] leading-snug">
                    <span className="font-semibold">{n.actorName}</span>{' '}
                    <span className="text-fg-muted">{line(n)}</span>
                  </div>
                  {(n.kind === 'comment' || n.kind === 'physique-comment') && n.preview && (
                    <div className="text-[12px] text-fg-subtle truncate mt-0.5">“{n.preview}”</div>
                  )}
                </div>
                <span className="text-[10px] text-fg-subtle shrink-0">
                  {prettyDate(n.createdAt.slice(0, 10))}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!live && items.length > 0 && (
        <p className="text-[11px] text-fg-subtle text-center mt-3 leading-snug">
          Not connected live right now — this refreshes every 30 seconds and whenever you reopen the app.
        </p>
      )}
    </Sheet>
  );
}
