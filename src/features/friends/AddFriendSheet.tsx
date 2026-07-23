import { useRef, useState } from 'react';
import { Loader2, Search, UserPlus, X } from 'lucide-react';
import { Button, CardLabel, Sheet } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { searchProfiles } from '../../lib/social';
import { useSocial } from '../../store/useSocial';
import { Avatar } from './Avatar';

interface Result {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

/** Find people by share code (exact) or display-name prefix, send requests,
 *  and manage outgoing ones. */
export function AddFriendSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const friends = useSocial((s) => s.friends);
  const requestsOut = useSocial((s) => s.requestsOut);
  const sendRequest = useSocial((s) => s.sendRequest);
  const declineOrCancel = useSocial((s) => s.declineOrCancel);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery('');
    setResults([]);
    setBusy(false);
    setError(null);
    setSent(new Set());
    onClose();
  };

  // Debounced search, driven from the input handler (no effects needed).
  const onQueryChange = (raw: string) => {
    setQuery(raw);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = raw.trim();
    if (q.length < 2) {
      setResults([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchProfiles(q);
      setBusy(false);
      if (res.ok && res.data) {
        setResults(res.data);
        setError(null);
      } else {
        setError(res.message ?? 'Search failed');
      }
    }, 350);
  };

  const friendIds = new Set(friends.map((f) => f.userId));
  const pendingIds = new Set(requestsOut.map((r) => r.toId));

  return (
    <Sheet open={open} onClose={handleClose} title="Add a friend">
      <p className="text-sm text-fg-muted leading-relaxed -mt-1 mb-4">
        Enter their 6-letter share code, or search by name.
      </p>

      <div className="relative mb-3.5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Code or name"
          autoCapitalize="characters"
          spellCheck={false}
          aria-label="Share code or name"
          className="w-full h-12 pl-10 pr-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong tracking-wide"
        />
      </div>

      {error && <p className="text-[13px] text-danger mb-3">{error}</p>}
      {busy && (
        <div className="flex justify-center py-4 text-fg-muted">
          <Loader2 size={20} className="animate-spin" />
        </div>
      )}

      {!busy && results.length === 0 && query.trim().length >= 2 && (
        <p className="text-sm text-fg-muted text-center py-4">No one found for “{query.trim()}”.</p>
      )}

      <div className="space-y-2.5">
        {results.map((r) => {
          const isFriend = friendIds.has(r.userId);
          const isPending = pendingIds.has(r.userId) || sent.has(r.userId);
          return (
            <div key={r.userId} className="flex items-center gap-3 rounded-card border border-border bg-surface-2 p-3.5">
              <Avatar name={r.displayName} url={r.avatarUrl} size={38} />
              <div className="min-w-0 flex-1 font-semibold truncate">{r.displayName}</div>
              {isFriend ? (
                <span className="text-[12px] font-semibold text-fg-subtle">Friends</span>
              ) : isPending ? (
                <span className="text-[12px] font-semibold text-fg-subtle">Requested</span>
              ) : (
                <Button
                  size="sm"
                  variant="accent"
                  onClick={async () => {
                    haptics.tap();
                    const res = await sendRequest(r.userId);
                    if (res.ok) setSent((s) => new Set(s).add(r.userId));
                  }}
                >
                  <UserPlus size={15} /> Request
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {requestsOut.length > 0 && (
        <div className="mt-5">
          <CardLabel>Sent requests</CardLabel>
          <div className="space-y-2.5">
            {requestsOut.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-card border border-border bg-surface-2 p-3.5">
                <Avatar name={r.displayName} url={r.avatarUrl} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{r.displayName}</div>
                  <div className="text-[12px] text-fg-muted">Waiting for them to accept</div>
                </div>
                <button
                  onClick={() => {
                    haptics.tap();
                    void declineOrCancel(r.id);
                  }}
                  aria-label={`Cancel request to ${r.displayName}`}
                  className="w-9 h-9 grid place-items-center rounded-full bg-surface text-fg-muted border border-border"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}
