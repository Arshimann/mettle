import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Segmented } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useAuth } from '../../store/useAuth';

const inputCls =
  'w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong';

type Mode = 'signup' | 'signin';

/**
 * Email + password sign up / log in. Used both at first launch and in Settings.
 * On success the global auth listener (useAuth) restores cloud data and flips
 * sync on; `onSuccess` lets the caller advance its own flow.
 */
export function AuthPanel({ onSuccess }: { onSuccess?: (action: Mode) => void }) {
  const signUp = useAuth((s) => s.signUp);
  const signIn = useAuth((s) => s.signIn);

  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await (mode === 'signup' ? signUp : signIn)(email.trim(), password);
    setBusy(false);
    if (!res.ok) {
      haptics.warn();
      setError(res.message ?? 'Something went wrong');
      return;
    }
    if (res.message) {
      // Signup with email-confirmation on — no session yet, ask them to confirm.
      setNotice(res.message);
      setMode('signin');
      setPassword('');
      return;
    }
    haptics.success();
    onSuccess?.(mode);
  };

  return (
    <div>
      <Segmented
        fullWidth
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
          setNotice(null);
        }}
        options={[
          { value: 'signup', label: 'Sign up' },
          { value: 'signin', label: 'Log in' },
        ]}
      />

      <div className="space-y-2.5 mt-3.5">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          aria-label="Email"
          className={inputCls}
        />
        <input
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
          placeholder="Password (6+ characters)"
          aria-label="Password"
          className={inputCls}
        />
      </div>

      {error && <p className="text-[13px] text-danger mt-2.5 leading-snug">{error}</p>}
      {notice && <p className="text-[13px] text-fg-muted mt-2.5 leading-snug">{notice}</p>}

      <Button
        variant="accent"
        size="lg"
        fullWidth
        className="mt-3.5"
        disabled={!valid || busy}
        onClick={() => void submit()}
      >
        {busy ? (
          <Loader2 size={18} className="animate-spin" />
        ) : mode === 'signup' ? (
          'Create account'
        ) : (
          'Log in'
        )}
      </Button>
    </div>
  );
}
