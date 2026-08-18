import { useEffect, useMemo, useState } from 'react';
import { Camera, GitCompareArrows, Lock, Trash2, Users } from 'lucide-react';
import { Button, Card, CardLabel, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { prettyDate } from '../../lib/date';
import { useAuth } from '../../store/useAuth';
import { useSocial } from '../../store/useSocial';
import { usePhysique } from '../../store/usePhysique';
import { isSupabaseConfigured } from '../../lib/supabase';
import { PhysiqueComposer } from './PhysiqueComposer';
import { PhysiqueCompare } from './PhysiqueCompare';
import { useSignedUrls } from './useSignedUrls';

/** Your own check-ins: a private timeline, with compare across any two. */
export function MyPhysique() {
  const status = useAuth((s) => s.status);
  const userId = useSocial((s) => s.userId);
  const myPosts = usePhysique((s) => s.myPosts);
  const loadMine = usePhysique((s) => s.loadMine);
  const setVisibility = usePhysique((s) => s.setVisibility);
  const remove = usePhysique((s) => s.remove);

  const [composerOpen, setComposerOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [confirmShare, setConfirmShare] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (userId) void loadMine(userId);
  }, [userId, loadMine]);

  const urls = useSignedUrls(myPosts.map((p) => p.thumbPath));
  const actionPost = actionFor ? myPosts.find((p) => p.id === actionFor) : null;
  const comparePair = useMemo(
    () => (picked.length === 2 ? picked.map((id) => myPosts.find((p) => p.id === id)!).filter(Boolean) : null),
    [picked, myPosts],
  );

  if (!isSupabaseConfigured || status !== 'signed-in') return null;

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardLabel className="mb-0">Physique check-ins</CardLabel>
          {myPosts.length >= 2 && (
            <button
              onClick={() => {
                haptics.tap();
                setSelecting((v) => !v);
                setPicked([]);
              }}
              className="text-[13px] font-semibold text-accent flex items-center gap-1"
            >
              <GitCompareArrows size={14} /> {selecting ? 'Cancel' : 'Compare'}
            </button>
          )}
        </div>

        {myPosts.length === 0 ? (
          <p className="text-sm text-fg-muted leading-relaxed mb-3.5">
            Photos beat the scale for tracking how you actually look. These stay private unless you
            deliberately share one.
          </p>
        ) : (
          <>
            {selecting && (
              <p className="text-[12.5px] text-fg-muted mb-2.5">
                Pick two to compare {picked.length > 0 && `· ${picked.length}/2`}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2 mb-3.5">
              {myPosts.map((p) => {
                const url = urls.get(p.thumbPath);
                const isPicked = picked.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      haptics.select();
                      if (selecting) {
                        setPicked((cur) =>
                          cur.includes(p.id) ? cur.filter((x) => x !== p.id) : [...cur, p.id].slice(-2),
                        );
                      } else {
                        // Never toggle visibility straight from a tap — a
                        // mis-tap in a grid would publish a photo of your body.
                        setActionFor(p.id);
                      }
                    }}
                    className={cn(
                      'relative aspect-[3/4] rounded-btn overflow-hidden bg-surface-2 border-2 transition-colors',
                      isPicked ? 'border-accent' : 'border-transparent',
                    )}
                  >
                    {url ? (
                      <img src={url} alt={`Check-in ${prettyDate(p.takenOn)}`} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-fg-subtle text-[10px]">…</span>
                    )}
                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-canvas/80 backdrop-blur grid place-items-center">
                      {p.visibility === 'private' ? (
                        <Lock size={10} className="text-fg-muted" />
                      ) : (
                        <Users size={10} className="text-accent" />
                      )}
                    </span>
                    <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] font-semibold py-1 px-1.5 text-left">
                      {prettyDate(p.takenOn)}
                    </span>
                  </button>
                );
              })}
            </div>
            {!selecting && (
              <p className="text-[11px] text-fg-subtle mb-3">
                Tap a photo for sharing and delete options.
              </p>
            )}
          </>
        )}

        <Button variant="accent" fullWidth onClick={() => { haptics.tap(); setComposerOpen(true); }}>
          <Camera size={17} /> Add a check-in
        </Button>
      </Card>

      {/* Per-photo actions. Sharing needs a second tap; deleting does too. */}
      <Sheet
        open={actionFor != null}
        onClose={() => {
          setActionFor(null);
          setConfirmShare(false);
          setConfirmDelete(false);
        }}
        title={actionPost ? prettyDate(actionPost.takenOn) : undefined}
      >
        {actionPost && (
          <div className="space-y-2.5">
            <Card className="flex items-start gap-2.5 p-3">
              {actionPost.visibility === 'private' ? (
                <>
                  <Lock size={15} className="text-fg-subtle shrink-0 mt-0.5" />
                  <p className="text-[13px] text-fg-muted leading-snug">
                    Only you can see this photo.
                  </p>
                </>
              ) : (
                <>
                  <Users size={15} className="text-accent shrink-0 mt-0.5" />
                  <p className="text-[13px] text-fg-muted leading-snug">
                    Shared — your friends can see this photo on the board.
                  </p>
                </>
              )}
            </Card>

            {actionPost.visibility === 'private' ? (
              <Button
                variant={confirmShare ? 'danger' : 'outline'}
                size="lg"
                fullWidth
                onClick={() => {
                  if (!confirmShare) {
                    setConfirmShare(true);
                    haptics.warn();
                    setTimeout(() => setConfirmShare(false), 4000);
                    return;
                  }
                  void setVisibility(actionPost.id, 'friends');
                  haptics.success();
                  setActionFor(null);
                  setConfirmShare(false);
                }}
              >
                <Users size={16} />{' '}
                {confirmShare ? 'Tap again — friends will see it' : 'Share with friends'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => {
                  void setVisibility(actionPost.id, 'private');
                  haptics.success();
                  setActionFor(null);
                }}
              >
                <Lock size={16} /> Make it private again
              </Button>
            )}

            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  haptics.warn();
                  setTimeout(() => setConfirmDelete(false), 4000);
                  return;
                }
                void remove(actionPost);
                setActionFor(null);
                setConfirmDelete(false);
              }}
            >
              <Trash2 size={16} /> {confirmDelete ? 'Tap again to delete for good' : 'Delete this check-in'}
            </Button>
          </div>
        )}
      </Sheet>

      <PhysiqueComposer open={composerOpen} onClose={() => setComposerOpen(false)} />

      {comparePair && comparePair.length === 2 && (
        <PhysiqueCompare
          a={comparePair[0]}
          b={comparePair[1]}
          onClose={() => {
            setPicked([]);
            setSelecting(false);
          }}
        />
      )}
    </>
  );
}
