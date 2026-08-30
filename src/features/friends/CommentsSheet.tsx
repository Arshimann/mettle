import { UNKNOWN_NAME } from '../../lib/social';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { Sheet } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { prettyDate } from '../../lib/date';
import type { SocialResult } from '../../lib/social';
import { Avatar } from './Avatar';

interface CommentRow {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

/** The thread's data source, injected so one sheet serves workouts and
 *  physique posts without either knowing about the other. */
export interface CommentApi {
  list: () => Promise<SocialResult<CommentRow[]>>;
  add: (authorId: string, body: string) => Promise<SocialResult>;
  remove: (id: string) => Promise<SocialResult>;
}

export function CommentsSheet({
  open,
  onClose,
  myId,
  names,
  api,
  title = 'Comments',
  canModerate = false,
}: {
  open: boolean;
  onClose: () => void;
  myId: string;
  /** userId → display name (friends + me + the owner) */
  names: Map<string, { displayName: string; avatarUrl: string | null }>;
  api: CommentApi;
  title?: string;
  /** Post owners can remove other people's comments on their own content. */
  canModerate?: boolean;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await api.list();
    if (res.ok && res.data) setComments(res.data);
    setLoading(false);
    // api is rebuilt per render by callers; the sheet is keyed per subject so
    // remounting is the reset, and listing once on mount is correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let stale = false;
    void (async () => {
      const res = await api.list();
      if (stale) return;
      if (res.ok && res.data) setComments(res.data);
      setLoading(false);
    })();
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    const res = await api.add(myId, text);
    setBusy(false);
    if (res.ok) {
      haptics.success();
      setDraft('');
      void load();
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={title}>
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
            const name = who?.displayName ?? UNKNOWN_NAME;
            const canDelete = c.authorId === myId || canModerate;
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar name={name} url={who?.avatarUrl ?? null} size={30} />
                <div className="min-w-0 flex-1 rounded-card bg-surface-2 border border-border px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-bold truncate">{name}</span>
                    <span className="text-[10px] text-fg-subtle shrink-0">
                      {prettyDate(c.createdAt.slice(0, 10))}
                    </span>
                  </div>
                  <p className="text-[14px] leading-snug mt-0.5 break-words">{c.body}</p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => {
                      haptics.tap();
                      void api.remove(c.id).then(load);
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
