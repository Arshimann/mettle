import { useCallback, useEffect, useState } from 'react';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { Sheet } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { prettyDate } from '../../lib/date';
import { addComment, deleteComment, fetchComments } from '../../lib/social';
import type { WorkoutComment } from '../../types/social';
import { Avatar } from './Avatar';

/** Comment thread on one published workout. */
export function CommentsSheet({
  open,
  onClose,
  ownerId,
  workoutKey,
  myId,
  names,
}: {
  open: boolean;
  onClose: () => void;
  ownerId: string;
  workoutKey: string;
  myId: string;
  /** userId → display name (friends + me + the profile owner) */
  names: Map<string, { displayName: string; avatarUrl: string | null }>;
}) {
  // Mounted fresh per workout (parent keys it), so state resets on unmount.
  const [comments, setComments] = useState<WorkoutComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchComments(ownerId, workoutKey);
    if (res.ok && res.data) setComments(res.data);
    setLoading(false);
  }, [ownerId, workoutKey]);

  useEffect(() => {
    let stale = false;
    void (async () => {
      const res = await fetchComments(ownerId, workoutKey);
      if (stale) return;
      if (res.ok && res.data) setComments(res.data);
      setLoading(false);
    })();
    return () => {
      stale = true;
    };
  }, [ownerId, workoutKey]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    const res = await addComment(ownerId, workoutKey, myId, text);
    setBusy(false);
    if (res.ok) {
      haptics.success();
      setDraft('');
      void load();
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Comments">
      {loading ? (
        <div className="flex justify-center py-8 text-fg-muted">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-fg-muted text-center py-6">No comments yet — say something.</p>
      ) : (
        <div className="space-y-3 mb-1">
          {comments.map((c) => {
            const who = names.get(c.authorId);
            const name = who?.displayName ?? 'Lifter';
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar name={name} url={who?.avatarUrl ?? null} size={30} />
                <div className="min-w-0 flex-1 rounded-card bg-surface-2 border border-border px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-bold truncate">{name}</span>
                    <span className="text-[10px] text-fg-subtle shrink-0">{prettyDate(c.createdAt.slice(0, 10))}</span>
                  </div>
                  <p className="text-[14px] leading-snug mt-0.5 break-words">{c.body}</p>
                </div>
                {c.authorId === myId && (
                  <button
                    onClick={() => {
                      haptics.tap();
                      void deleteComment(c.id).then(load);
                    }}
                    aria-label="Delete comment"
                    className="w-7 h-7 grid place-items-center text-fg-subtle shrink-0 mt-1"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
          placeholder="Add a comment…"
          maxLength={500}
          aria-label="Add a comment"
          className="flex-1 h-11 px-3.5 rounded-btn bg-surface-2 border border-border text-[14px] outline-none focus:border-border-strong"
        />
        <button
          onClick={() => void submit()}
          disabled={!draft.trim() || busy}
          aria-label="Send comment"
          className="w-11 h-11 rounded-btn bg-accent bg-accent-grad text-accent-fg grid place-items-center disabled:opacity-40"
        >
          {busy ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
        </button>
      </div>
    </Sheet>
  );
}
