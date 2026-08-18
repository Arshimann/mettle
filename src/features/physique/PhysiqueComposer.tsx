import { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Loader2, Lock, Users } from 'lucide-react';
import { Button, Card, CardLabel, Segmented, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { todayStr } from '../../lib/date';
import { fmtWeight, fromKg, unitLabel } from '../../lib/units';
import { useStore } from '../../store/useStore';
import { useSocial } from '../../store/useSocial';
import { usePhysique } from '../../store/usePhysique';
import type { PhysiquePose, PhysiqueVisibility } from '../../lib/physique';

const POSES: { id: PhysiquePose; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
  { id: 'back', label: 'Back' },
  { id: 'other', label: 'Other' },
];

/**
 * Post a check-in. Visibility defaults to private and sharing takes a
 * deliberate second tap — these are photos of someone's body, so the safe
 * option has to be the effortless one.
 */
export function PhysiqueComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const userId = useSocial((s) => s.userId);
  const friendCount = useSocial((s) => s.friends.length);
  const bodyWeight = useStore((s) => s.bodyWeight);
  const units = useStore((s) => s.settings.units);
  const post = usePhysique((s) => s.post);

  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  // The object URL is derived from the file, so it's created alongside it
  // rather than in an effect that would re-render to catch up.
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);
  const file = picked?.file ?? null;
  const preview = picked?.url ?? null;
  const [pose, setPose] = useState<PhysiquePose>('front');
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<PhysiqueVisibility>('private');
  const [confirmShare, setConfirmShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestWeight = [...bodyWeight].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.weight ?? null;

  /** Swaps the picked file, revoking the previous object URL so it can't leak. */
  const choose = (f: File | null) => {
    setPicked((cur) => {
      if (cur) URL.revokeObjectURL(cur.url);
      return f ? { file: f, url: URL.createObjectURL(f) } : null;
    });
  };

  // Last resort: revoke on unmount if the sheet closes mid-pick.
  useEffect(() => () => setPicked((cur) => {
    if (cur) URL.revokeObjectURL(cur.url);
    return null;
  }), []);

  const reset = () => {
    choose(null);
    setCaption('');
    setVisibility('private');
    setConfirmShare(false);
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!file || !userId || busy) return;
    setBusy(true);
    setError(null);
    const res = await post(userId, file, {
      takenOn: todayStr(),
      pose,
      caption,
      weightKg: latestWeight,
      visibility,
    });
    setBusy(false);
    if (!res.ok) {
      haptics.warn();
      setError(res.message ?? 'Could not save that photo');
      return;
    }
    haptics.success();
    reset();
  };

  return (
    <Sheet open={open} onClose={reset} title="New check-in">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) choose(f);
          e.target.value = '';
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) choose(f);
          e.target.value = '';
        }}
      />

      {!file ? (
        <div className="space-y-2.5">
          <p className="text-sm text-fg-muted leading-relaxed -mt-1 mb-1">
            Track how you actually look over time. Photos stay private unless you choose otherwise.
          </p>
          <Button variant="accent" size="lg" fullWidth onClick={() => cameraRef.current?.click()}>
            <Camera size={18} /> Take a photo
          </Button>
          <Button size="lg" fullWidth onClick={() => libraryRef.current?.click()}>
            <ImageIcon size={18} /> Choose from library
          </Button>
        </div>
      ) : (
        <div>
          {preview && (
            <img
              src={preview}
              alt="Your check-in preview"
              className="w-full max-h-[38vh] object-contain rounded-card bg-surface-2 mb-3.5"
            />
          )}

          <CardLabel>Pose</CardLabel>
          <div className="grid grid-cols-4 gap-2 mb-3.5">
            {POSES.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  haptics.select();
                  setPose(p.id);
                }}
                className={cn(
                  'h-10 rounded-btn border text-[13px] font-semibold transition-colors',
                  pose === p.id ? 'border-accent bg-accent-soft text-fg' : 'border-border bg-surface-2 text-fg-muted',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            maxLength={280}
            className="w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong mb-3.5"
          />

          <CardLabel>Who can see this</CardLabel>
          <Segmented
            fullWidth
            value={visibility}
            onChange={(v) => {
              haptics.select();
              // Switching to shared always re-arms the confirm.
              setConfirmShare(false);
              setVisibility(v);
            }}
            options={[
              { value: 'private' as PhysiqueVisibility, label: 'Just me' },
              { value: 'friends' as PhysiqueVisibility, label: 'Friends' },
            ]}
          />
          <Card className="flex items-start gap-2.5 p-3 mt-2.5">
            {visibility === 'private' ? (
              <>
                <Lock size={15} className="text-fg-subtle shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-fg-muted leading-snug">
                  Only you can see this. It still counts toward your own timeline.
                </p>
              </>
            ) : (
              <>
                <Users size={15} className="text-accent shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-fg-muted leading-snug">
                  {friendCount === 0
                    ? 'Nobody yet — you have no friends added. Anyone you add later will see it.'
                    : `Your ${friendCount} friend${friendCount === 1 ? '' : 's'} will see this photo.`}{' '}
                  You can make it private again any time.
                </p>
              </>
            )}
          </Card>

          {error && <p className="text-[13px] text-danger mt-2.5 leading-snug">{error}</p>}

          {latestWeight != null && (
            <p className="text-[11px] text-fg-subtle mt-2.5">
              Stamped with your latest weight: {fmtWeight(latestWeight, units)}
              {unitLabel(units)} ({Math.round(fromKg(latestWeight, units))} shown on compare)
            </p>
          )}

          <Button
            variant="accent"
            size="lg"
            fullWidth
            className="mt-3.5"
            disabled={busy}
            onClick={() => {
              // Sharing needs a second, deliberate tap.
              if (visibility === 'friends' && !confirmShare) {
                setConfirmShare(true);
                haptics.warn();
                setTimeout(() => setConfirmShare(false), 4000);
                return;
              }
              void submit();
            }}
          >
            {busy ? (
              <Loader2 size={18} className="animate-spin" />
            ) : visibility === 'private' ? (
              'Save privately'
            ) : confirmShare ? (
              'Tap again to post it'
            ) : (
              'Post to the board'
            )}
          </Button>
          <button onClick={() => choose(null)} className="w-full text-[13px] font-semibold text-fg-muted mt-3">
            Pick a different photo
          </button>
        </div>
      )}
    </Sheet>
  );
}
