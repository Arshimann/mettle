import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useStore } from '../store/useStore';
import type { PresenceInfo } from '../types/social';

/**
 * One shared Realtime presence channel for everyone ("who's at the gym").
 * Each client tracks { training } keyed by their userId; consumers filter the
 * roster down to their friends. Joined lazily — only once the Friends tab has
 * been opened this session — to conserve free-tier connections.
 */

const CHANNEL = 'presence:gym';

let channel: RealtimeChannel | null = null;
let unsubStore: (() => void) | null = null;
let retrackTimer: ReturnType<typeof setTimeout> | null = null;

function rosterFromChannel(ch: RealtimeChannel): Record<string, PresenceInfo> {
  const state = ch.presenceState<{ training?: boolean }>();
  const roster: Record<string, PresenceInfo> = {};
  for (const [key, metas] of Object.entries(state)) {
    roster[key] = { online: true, training: metas.some((m) => Boolean(m.training)) };
  }
  return roster;
}

export function joinPresence(
  userId: string,
  onRoster: (roster: Record<string, PresenceInfo>) => void,
): void {
  if (!supabase || channel) return;

  const ch = supabase.channel(CHANNEL, { config: { presence: { key: userId } } });
  channel = ch;

  const track = () => {
    void ch.track({ training: Boolean(useStore.getState().activeSession), at: Date.now() });
  };

  ch.on('presence', { event: 'sync' }, () => onRoster(rosterFromChannel(ch)));
  ch.subscribe((status) => {
    if (status === 'SUBSCRIBED') track();
  });

  // Re-track when a session starts/ends → live "Training now" flag.
  let wasTraining = Boolean(useStore.getState().activeSession);
  unsubStore = useStore.subscribe((s) => {
    const training = Boolean(s.activeSession);
    if (training === wasTraining) return;
    wasTraining = training;
    if (retrackTimer) clearTimeout(retrackTimer);
    retrackTimer = setTimeout(track, 2000);
  });
}

export function leavePresence(): void {
  if (retrackTimer) clearTimeout(retrackTimer);
  retrackTimer = null;
  unsubStore?.();
  unsubStore = null;
  if (channel) {
    void channel.unsubscribe();
    channel = null;
  }
}

export function presenceJoined(): boolean {
  return channel != null;
}
