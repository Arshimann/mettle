import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button, Card, Sheet } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useAuth } from '../../store/useAuth';

const inputCls =
  'w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong';

/**
 * Shown when the app is opened from a password-reset email. The recovery
 * session is already live at this point, so this is the one screen that must
 * be dealt with before anything else — dismissing it leaves the account on its
 * old password, which is a valid choice, so the escape hatch stays.
 */
export function PasswordReset() {
  const recovery = useAuth((s) => s.recovery);
  const updatePassword = useAuth((s) => s.updatePassword);
  const dismissRecovery = useAuth((s) => s.dismissRecovery);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!recovery) return null;

  const tooShort = password.length > 0 && password.length < 6;
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid = password.length >= 6 && confirm === password;

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    const res = await updatePassword(password);
    setBusy(false);
    if (!res.ok) {
      haptics.warn();
      setError(res.message ?? 'Could not update your password');
      return;
    }
    haptics.success();
    setDone(true);
  };

  return (
    <Sheet open onClose={dismissRecovery} title={done ? 'Password updated' : 'Set a new password'}>
      {done ? (
        <>
          <p className="text-sm text-fg-muted leading-relaxed -mt-1 mb-4">
            You're signed in with your new password. It's the one to use from now on.
          </p>
          <Button variant="accent" size="lg" fullWidth onClick={dismissRecovery}>
            Done
          </Button>
        </>
      ) : (
        <>
          <Card className="flex items-center gap-3 p-3.5 mb-4 -mt-1">
            <span className="w-9 h-9 rounded-btn bg-accent-soft text-accent grid place-items-center shrink-0">
              <KeyRound size={17} />
            </span>
            <p className="text-[13px] text-fg-muted leading-snug">
              Pick something you'll remember — at least 6 characters.
            </p>
          </Card>

          <div className="space-y-2.5">
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              aria-label="New password"
              className={inputCls}
            />
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void save();
              }}
              placeholder="Confirm new password"
              aria-label="Confirm new password"
              className={inputCls}
            />
          </div>

          {tooShort && <p className="text-[13px] text-fg-muted mt-2.5">A bit longer — 6 characters minimum.</p>}
          {mismatch && <p className="text-[13px] text-danger mt-2.5">Those two don't match.</p>}
          {error && <p className="text-[13px] text-danger mt-2.5 leading-snug">{error}</p>}

          <Button
            variant="accent"
            size="lg"
            fullWidth
            className="mt-3.5"
            disabled={!valid || busy}
            onClick={() => void save()}
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : 'Save password'}
          </Button>
          <button onClick={dismissRecovery} className="w-full text-[13px] font-semibold text-fg-muted mt-3">
            Not now
          </button>
        </>
      )}
    </Sheet>
  );
}
