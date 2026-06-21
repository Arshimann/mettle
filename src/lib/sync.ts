import { supabase } from './supabase';
import { useStore } from '../store/useStore';

/**
 * Cloud sync engine. Stores the whole app state as one opaque JSON blob in
 * profiles.user_data and reconciles last-write-wins by timestamp.
 *
 * It reuses the existing storage seam — exportData()/importData() on the store —
 * so the on-device format and the cloud format are identical, and nothing here
 * touches localStorage directly except a single "last changed" timestamp used
 * for the LWW decision.
 *
 * Everything no-ops when Supabase is unconfigured (supabase === null).
 */

const UPDATED_KEY = 'mettle.sync.updatedAt';

/** Stamp "local changed just now" — drives the last-write-wins comparison. */
export function markLocalChange(): void {
  try {
    localStorage.setItem(UPDATED_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

function localUpdatedAt(): string | null {
  try {
    return localStorage.getItem(UPDATED_KEY);
  } catch {
    return null;
  }
}

function setLocalUpdatedAt(ts: string): void {
  try {
    localStorage.setItem(UPDATED_KEY, ts);
  } catch {
    /* ignore */
  }
}

/** Does this device hold anything worth keeping over an empty/older cloud copy? */
function hasLocalData(): boolean {
  const s = useStore.getState();
  return (
    s.history.length > 0 ||
    s.split.length > 0 ||
    s.savedSplits.length > 0 ||
    s.prs.length > 0 ||
    s.bodyWeight.length > 0 ||
    s.goals.length > 0 ||
    s.supplements.length > 0
  );
}

export interface SyncResult {
  ok: boolean;
  message?: string;
  at?: string;
  applied?: 'remote' | 'local';
}

interface UserDataBlob {
  data: unknown; // an exportData() envelope
  updatedAt: string;
}

/** Write the current device state up to the cloud. */
export async function pushToCloud(userId: string): Promise<SyncResult> {
  if (!supabase) return { ok: false, message: 'Cloud sync is not set up' };
  const now = new Date().toISOString();
  const envelope = JSON.parse(useStore.getState().exportData());
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, user_data: { data: envelope, updatedAt: now } satisfies UserDataBlob }, {
      onConflict: 'id',
    });
  if (error) return { ok: false, message: error.message };
  setLocalUpdatedAt(now);
  return { ok: true, at: now, applied: 'local' };
}

/**
 * Reconcile this device with the cloud (last-write-wins):
 *  - cloud empty            → seed it with local data
 *  - cloud newer / no local → adopt the cloud copy
 *  - local newer            → push local up
 */
export async function pullFromCloud(userId: string): Promise<SyncResult> {
  if (!supabase) return { ok: false, message: 'Cloud sync is not set up' };
  const { data: row, error } = await supabase
    .from('profiles')
    .select('user_data, updated_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) return { ok: false, message: error.message };

  const remote = (row?.user_data ?? null) as UserDataBlob | null;

  // Nothing in the cloud yet — this device becomes the source of truth.
  if (!remote || !remote.data) {
    return pushToCloud(userId);
  }

  const remoteAt = remote.updatedAt || (row?.updated_at as string | undefined) || '';
  const localAt = localUpdatedAt();

  // Adopt the cloud copy when this device has nothing, has never synced, or the
  // cloud is strictly newer. ISO-8601 UTC strings compare correctly as text.
  if (!localAt || !hasLocalData() || remoteAt > localAt) {
    useStore.getState().importData(JSON.stringify(remote.data));
    setLocalUpdatedAt(remoteAt || new Date().toISOString());
    return { ok: true, at: remoteAt, applied: 'remote' };
  }

  // This device is ahead — push it up.
  return pushToCloud(userId);
}
