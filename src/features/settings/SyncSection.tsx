import { useState, type ComponentType } from 'react';
import { Cloud, CloudOff, RefreshCw, LogOut, Check, Loader2, TriangleAlert } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useAuth, type SyncStatus } from '../../store/useAuth';
import { AuthPanel } from '../auth/AuthPanel';

function relTime(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Line {
  Icon: ComponentType<{ size?: number; className?: string }>;
  text: string;
  tone: 'muted' | 'ok' | 'danger';
  spin?: boolean;
}

function statusLine(s: SyncStatus, lastSyncedAt: string | null, error: string | null): Line {
  switch (s) {
    case 'syncing':
      return { Icon: Loader2, text: 'Syncing…', tone: 'muted', spin: true };
    case 'synced':
      return { Icon: Check, text: lastSyncedAt ? `Backed up ${relTime(lastSyncedAt)}` : 'Backed up', tone: 'ok' };
    case 'offline':
      return { Icon: CloudOff, text: 'Offline — will sync when you reconnect', tone: 'muted' };
    case 'error':
      return { Icon: TriangleAlert, text: error ?? 'Sync failed', tone: 'danger' };
    default:
      return { Icon: Cloud, text: 'Ready to sync', tone: 'muted' };
  }
}

export function SyncSection() {
  const configured = useAuth((s) => s.configured);
  const status = useAuth((s) => s.status);
  const email = useAuth((s) => s.email);
  const syncStatus = useAuth((s) => s.syncStatus);
  const lastSyncedAt = useAuth((s) => s.lastSyncedAt);
  const error = useAuth((s) => s.error);
  const syncNow = useAuth((s) => s.syncNow);
  const signOut = useAuth((s) => s.signOut);

  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <Card className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          <CloudOff size={18} className="text-fg-muted" />
          <div className="font-semibold">Cloud sync isn't set up</div>
        </div>
        <p className="text-sm text-fg-muted leading-relaxed">
          This build runs fully on this device. To back up and sync across devices, connect a
          Supabase project — the steps are in <span className="font-medium text-fg">docs/DEPLOY.md</span>.
          Meanwhile, use Export in the Data section to keep a backup file.
        </p>
      </Card>
    );
  }

  if (status === 'loading') {
    return (
      <Card>
        <div className="flex items-center gap-2.5 text-fg-muted">
          <Loader2 size={18} className="animate-spin" /> Checking sign-in…
        </div>
      </Card>
    );
  }

  if (status === 'signed-out') {
    return (
      <Card className="space-y-3.5">
        <div>
          <div className="font-semibold">Back up &amp; sync</div>
          <p className="text-sm text-fg-muted leading-snug mt-0.5">
            Sign in to back up your data and keep it in sync across devices. Last device to save wins.
          </p>
        </div>
        <AuthPanel />
      </Card>
    );
  }

  const line = statusLine(syncStatus, lastSyncedAt, error);
  const toneClass =
    line.tone === 'danger' ? 'text-danger' : line.tone === 'ok' ? 'text-accent' : 'text-fg-muted';

  return (
    <Card className="space-y-3.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent-soft grid place-items-center text-accent shrink-0">
          <Cloud size={20} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{email}</div>
          <div className={cn('text-[13px] flex items-center gap-1.5 mt-0.5', toneClass)}>
            <line.Icon size={13} className={line.spin ? 'animate-spin' : ''} />
            <span className="truncate">{line.text}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Button
          disabled={busy || syncStatus === 'syncing'}
          onClick={async () => {
            setBusy(true);
            await syncNow();
            setBusy(false);
          }}
        >
          <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} /> Sync now
        </Button>
        <Button
          variant="danger"
          onClick={async () => {
            haptics.warn();
            await signOut();
          }}
        >
          <LogOut size={16} /> Sign out
        </Button>
      </div>

      <p className="text-[12px] text-fg-subtle leading-snug">
        Signing out keeps your data on this device and stops syncing. Sign back in anytime.
      </p>
    </Card>
  );
}
