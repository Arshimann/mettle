import { useEffect, useMemo, useState } from 'react';
import { Camera, ImageOff, Loader2, MessageCircle } from 'lucide-react';
import { Button, Card, EmptyState } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { sfxPop } from '../../lib/sound';
import { prettyDate } from '../../lib/date';
import { fmtWeight, unitLabel } from '../../lib/units';
import { useStore } from '../../store/useStore';
import { useSocial } from '../../store/useSocial';
import { usePhysique } from '../../store/usePhysique';
import {
  addPhysiqueComment,
  deletePhysiqueComment,
  fetchPhysiqueComments,
  type PhysiquePost,
} from '../../lib/physique';
import { Avatar } from '../friends/Avatar';
import { CommentsSheet } from '../friends/CommentsSheet';
import { PhysiqueComposer } from './PhysiqueComposer';
import { useSignedUrls } from './useSignedUrls';

const REACTIONS = ['💪', '🔥', '👏', '😮', '🎉'] as const;

function PostCard({
  post,
  url,
  onOpenComments,
}: {
  post: PhysiquePost;
  url?: string;
  onOpenComments: () => void;
}) {
  const units = useStore((s) => s.settings.units);
  const friends = useSocial((s) => s.friends);
  const myId = useSocial((s) => s.userId);
  const reactions = usePhysique((s) => s.reactions);
  const react = usePhysique((s) => s.react);

  const author = friends.find((f) => f.userId === post.userId);
  const mine = reactions.find((r) => r.postId === post.id && r.reactorId === myId)?.emoji ?? null;
  const counts = new Map<string, number>();
  for (const r of reactions) if (r.postId === post.id) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center gap-3 p-3.5">
        <Avatar name={author?.displayName ?? 'Lifter'} url={author?.avatarUrl ?? null} size={36} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[14px] truncate">{author?.displayName ?? 'Lifter'}</div>
          <div className="text-[11px] text-fg-muted">
            {prettyDate(post.takenOn)} · {post.pose}
            {post.weightKg != null && ` · ${fmtWeight(post.weightKg, units)}${unitLabel(units)}`}
          </div>
        </div>
      </div>

      <div className="aspect-[4/5] bg-surface-2">
        {url ? (
          <img src={url} alt={`${author?.displayName ?? 'A friend'}'s check-in`} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full grid place-items-center text-fg-subtle">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
      </div>

      {post.caption && <p className="text-[14px] leading-snug px-3.5 pt-3">{post.caption}</p>}

      <div className="flex items-center gap-1.5 p-3.5">
        {REACTIONS.map((e) => {
          const n = counts.get(e) ?? 0;
          const active = mine === e;
          return (
            <button
              key={e}
              onClick={() => {
                if (!myId) return;
                haptics.select();
                sfxPop();
                void react(post.id, myId, active ? null : e);
              }}
              aria-label={`React ${e}`}
              aria-pressed={active}
              className={cn(
                'h-8 min-w-8 px-1.5 rounded-full border text-[14px] leading-none inline-flex items-center justify-center gap-1 transition-colors',
                active ? 'border-accent bg-accent-soft' : 'border-border bg-surface-2',
              )}
            >
              <span>{e}</span>
              {n > 0 && <span className="text-[11px] font-bold tabular text-fg-muted">{n}</span>}
            </button>
          );
        })}
        <button
          onClick={() => {
            haptics.tap();
            onOpenComments();
          }}
          aria-label="Comments"
          className="ml-auto h-8 px-2.5 rounded-full border border-border bg-surface-2 text-fg-muted inline-flex items-center gap-1.5 text-[12px] font-semibold"
        >
          <MessageCircle size={14} /> Comments
        </button>
      </div>
    </Card>
  );
}

/** Friends' shared check-ins, newest first. */
export function PhysiqueBoard() {
  const myId = useSocial((s) => s.userId);
  const myShared = useSocial((s) => s.myShared);
  const friends = useSocial((s) => s.friends);
  const board = usePhysique((s) => s.board);
  const loading = usePhysique((s) => s.loadingBoard);
  const loadBoard = usePhysique((s) => s.loadBoard);

  const [composerOpen, setComposerOpen] = useState(false);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard, friends.length]);

  const urls = useSignedUrls(board.map((p) => p.path));

  const names = useMemo(() => {
    const m = new Map<string, { displayName: string; avatarUrl: string | null }>();
    for (const f of friends) m.set(f.userId, { displayName: f.displayName, avatarUrl: f.avatarUrl });
    if (myId && myShared?.displayName) {
      m.set(myId, { displayName: `${myShared.displayName} (you)`, avatarUrl: myShared.avatarUrl });
    }
    return m;
  }, [friends, myId, myShared]);

  return (
    <div className="space-y-3.5">
      <Button variant="accent" fullWidth onClick={() => { haptics.tap(); setComposerOpen(true); }}>
        <Camera size={17} /> Post a check-in
      </Button>

      {loading && board.length === 0 ? (
        <div className="flex justify-center py-10 text-fg-muted">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : board.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={ImageOff}
            title="Nothing on the board yet"
            body={
              friends.length === 0
                ? 'Add some friends, and anything they share shows up here.'
                : 'Nobody has shared a check-in yet. Post one and set it to Friends to start it off.'
            }
          />
        </Card>
      ) : (
        board.map((p) => (
          <PostCard key={p.id} post={p} url={urls.get(p.path)} onOpenComments={() => setCommentsFor(p.id)} />
        ))
      )}

      <PhysiqueComposer open={composerOpen} onClose={() => setComposerOpen(false)} />

      {commentsFor && myId && (
        <CommentsSheet
          key={commentsFor}
          open
          onClose={() => setCommentsFor(null)}
          myId={myId}
          names={names}
          api={{
            list: () => fetchPhysiqueComments(commentsFor),
            add: (authorId, body) => addPhysiqueComment(commentsFor, authorId, body),
            remove: (id) => deletePhysiqueComment(id),
          }}
        />
      )}
    </div>
  );
}
