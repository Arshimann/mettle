import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, Mail } from 'lucide-react';
import { Button, Card, CardLabel, Sheet } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useAuth } from '../../store/useAuth';
import { useUI } from '../../store/useUI';

/**
 * The account you are signed in as.
 *
 * The password is shown as dots with no reveal, and that is not an oversight:
 * Supabase stores a one-way hash, so the plaintext does not exist anywhere for
 * us to show. The only way to "reveal" it would be to keep a copy ourselves at
 * sign-in, which would put it in local storage for anyone holding the unlocked
 * phone — or reading a backup export — so the honest control is to change it.
 */

/** m•••••@gmail.com — enough to recognise, not enough to read over a shoulder. */
function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '•'.repeat(email.length);
  const local = email.slice(0, at);
  const domain = email.slice(at);
  return local[0] + '•'.repeat(Math.max(3, local.length - 1)) + domain;
}

const inputCls =
  'w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong';

export function Account() {
  const status = useAuth((s) => s.status);
  const email = useAuth((s) => s.email);
  const updatePassword = useAuth((s) => s.updatePassword);
  const resetPassword = useAuth((s) => s.resetPassword);
  const toast = useUI((s) => s.toast);

  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'signed-in' || !email) return null;

  const tooShort = pw.length > 0 && pw.length < 8;
  const mismatch = pw2.length > 0 && pw !== pw2;
  const canSave = pw.length >= 8 && pw === pw2 && !busy;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    const res = await updatePassword(pw);
    setBusy(false);
    if (!res.ok) {
      haptics.warn();
      setError(res.message ?? 'Could not change it');
      return;
    }
    haptics.success();
    setChangeOpen(false);
    setPw('');
    setPw2('');
    toast({ message: 'Password changed', tone: 'success' });
  };

  return (
    <>
      <Card className="space-y-3">
        <CardLabel>Account</CardLabel>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-surface-2 grid place-items-center text-fg-subtle shrink-0">
            <Mail size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-subtle">Email</div>
            <div className="text-[15px] font-medium truncate">
              {revealed ? email : maskEmail(email)}
            </div>
          </div>
          <button
            onClick={() => {
              haptics.tap();
              setRevealed((v) => !v);
            }}
            aria-label={revealed ? 'Hide email' : 'Show email'}
            className="w-9 h-9 grid place-items-center rounded-btn text-fg-subtle shrink-0"
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(email);
                setCopied(true);
                haptics.success();
                setTimeout(() => setCopied(false), 1800);
              } catch {
                /* clipboard unavailable — reveal and copy by hand */
              }
            }}
            aria-label="Copy email"
            className="w-9 h-9 grid place-items-center rounded-btn text-fg-subtle shrink-0"
          >
            {copied ? <Check size={16} className="text-success" /> : <Copy size={15} />}
          </button>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <div className="w-9 h-9 rounded-btn bg-surface-2 grid place-items-center text-fg-subtle shrink-0">
            <KeyRound size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-subtle">Password</div>
            <div className="text-[15px] font-medium tabular text-fg-muted tracking-[0.18em]">•••••••••</div>
          </div>
        </div>
        <p className="text-xs text-fg-subtle leading-snug -mt-1">
          Your password is stored as a one-way hash — even Mettle can’t read it back. Change it below
          if you’ve forgotten it.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <Button onClick={() => { haptics.tap(); setChangeOpen(true); }}>Change password</Button>
          <Button
            onClick={async () => {
              haptics.tap();
              const res = await resetPassword(email);
              toast({ message: res.message ?? 'Check your email', tone: res.ok ? 'success' : 'danger' });
            }}
          >
            Email a reset
          </Button>
        </div>
      </Card>

      <Sheet
        open={changeOpen}
        onClose={() => {
          setChangeOpen(false);
          setError(null);
        }}
        title="Change password"
      >
        <div className="space-y-3">
          <input
            type="password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="New password"
            aria-label="New password"
            className={inputCls}
          />
          <input
            type="password"
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void save();
            }}
            placeholder="Confirm new password"
            aria-label="Confirm new password"
            className={inputCls}
          />
          {tooShort && <p className="text-[13px] text-fg-muted">At least eight characters.</p>}
          {mismatch && <p className="text-[13px] text-danger">Those don’t match.</p>}
          {error && <p className="text-[13px] text-danger leading-snug">{error}</p>}
          <Button variant="accent" size="lg" fullWidth disabled={!canSave} onClick={() => void save()}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : 'Save new password'}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
