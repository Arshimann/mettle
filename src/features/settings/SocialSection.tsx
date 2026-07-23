import { useRef, useState, type ReactNode } from 'react';
import { Camera, Check, Copy, Loader2 } from 'lucide-react';
import { Button, Card, CardLabel, Switch } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useAuth } from '../../store/useAuth';
import { useSocial } from '../../store/useSocial';
import { Avatar } from '../friends/Avatar';

function Row({ label, desc, control }: { label: string; desc?: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="font-medium text-[15px]">{label}</div>
        {desc && <div className="text-xs text-fg-muted mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

/** Settings → Friends & privacy: identity (name, photo, code) + sharing flags. */
export function SocialSection() {
  const status = useAuth((s) => s.status);
  const myShared = useSocial((s) => s.myShared);
  const setDisplayName = useSocial((s) => s.setDisplayName);
  const setAvatar = useSocial((s) => s.setAvatar);
  const setPrivacyFlag = useSocial((s) => s.setPrivacyFlag);

  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null); // null = not editing
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'signed-in' || !myShared) {
    return (
      <Card>
        <CardLabel>Friends & privacy</CardLabel>
        <p className="text-sm text-fg-muted leading-relaxed">
          Sign in on the Friends tab to set up your profile, share code, and privacy.
        </p>
      </Card>
    );
  }

  const saveName = async () => {
    if (name == null || busy) return;
    setBusy(true);
    setError(null);
    const res = await setDisplayName(name);
    setBusy(false);
    if (!res.ok) {
      haptics.warn();
      setError(res.message ?? 'Could not save');
    } else {
      haptics.success();
      setName(null);
    }
  };

  const onPickFile = async (file: File) => {
    setUploading(true);
    setError(null);
    const res = await setAvatar(file);
    setUploading(false);
    if (!res.ok) {
      haptics.warn();
      setError(res.message ?? 'Upload failed');
    } else {
      haptics.success();
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(myShared.shareCode);
      setCopied(true);
      haptics.success();
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* code stays visible to copy by hand */
    }
  };

  return (
    <>
      <Card>
        <CardLabel>Profile</CardLabel>
        <div className="flex items-center gap-4 mt-1">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative shrink-0"
            aria-label="Change profile picture"
          >
            <Avatar name={myShared.displayName ?? '?'} url={myShared.avatarUrl} size={64} />
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent bg-accent-grad text-accent-fg grid place-items-center border-2 border-surface">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
            </span>
          </button>
          <div className="min-w-0 flex-1">
            {name == null ? (
              <>
                <div className="font-semibold text-[16px] truncate">{myShared.displayName ?? 'No name yet'}</div>
                <button onClick={() => setName(myShared.displayName ?? '')} className="text-[13px] font-semibold text-accent mt-0.5">
                  Edit name
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void saveName();
                  }}
                  maxLength={24}
                  aria-label="Display name"
                  className="min-w-0 flex-1 h-10 px-3 rounded-btn bg-surface-2 border border-border text-[14px] outline-none focus:border-border-strong"
                />
                <Button size="sm" variant="accent" disabled={(name ?? '').trim().length < 2 || busy} onClick={() => void saveName()}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPickFile(f);
            e.target.value = '';
          }}
        />
        {error && <p className="text-[13px] text-danger mt-2.5 leading-snug">{error}</p>}
      </Card>

      <Card className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium text-[15px]">Your share code</div>
          <div className="text-xl font-bold tracking-[0.18em] tabular mt-1">{myShared.shareCode}</div>
        </div>
        <Button size="sm" onClick={() => void copyCode()}>
          {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />} Copy
        </Button>
      </Card>

      <Card className="divide-y divide-border">
        <div className="pb-2.5">
          <div className="font-medium text-[15px]">What friends can see</div>
          <div className="text-xs text-fg-muted mt-0.5">
            Your name, streak, and consistency calendar are always visible to friends.
          </div>
        </div>
        <Row
          label="Workouts & PRs"
          desc="Published workouts, reactions, comments"
          control={
            <Switch
              checked={myShared.privacy.shareWorkouts}
              onChange={(v) => void setPrivacyFlag('shareWorkouts', v)}
              aria-label="Share workouts and PRs"
            />
          }
        />
        <Row
          label="Split & custom movements"
          desc="Your program and movement library"
          control={
            <Switch
              checked={myShared.privacy.shareSplit}
              onChange={(v) => void setPrivacyFlag('shareSplit', v)}
              aria-label="Share split and custom movements"
            />
          }
        />
      </Card>
    </>
  );
}
