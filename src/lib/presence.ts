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

/** Someone in the roster just went from idle to training. */
export interface PresenceDiff {
  userId: string;
}

// A user can only raise one "started training" per this window, which covers
// reconnects and the 2s re-track below.
const STARTED_COOLDOWN_MS = 90 * 60_000;
const lastStarted = new Map<string, number>();
let prevRoster: Record<string, PresenceInfo> = {};
let primed = false;

export function joinPresence(
  userId: string,
  onRoster: (roster: Record<string, PresenceInfo>) => void,
  onDiff?: (diffs: PresenceDiff[]) => void,
): void {
  if (!supabase || channel) return;

  const ch = supabase.channel(CHANNEL, { config: { presence: { key: userId } } });
  channel = ch;

  const track = () => {
    void ch.track({ training: Boolean(useStore.getState().activeSession), at: Date.now() });
  };

  ch.on('presence', { event: 'sync' }, () => {
    const roster = rosterFromChannel(ch);
    onRoster(roster);

    // The first sync seeds the baseline and emits nothing — otherwise everyone
    // already mid-workout when you open the app fires a notification.
    if (!primed) {
      prevRoster = roster;
      primed = true;
      return;
    }

    if (onDiff) {
      const now = Date.now();
      const started: PresenceDiff[] = [];
      for (const [id, info] of Object.entries(roster)) {
        if (id === userId || !info.training) continue;
        if (prevRoster[id]?.training) continue; // already training — not a transition
        if (now - (lastStarted.get(id) ?? 0) < STARTED_COOLDOWN_MS) continue;
        lastStarted.set(id, now);
        started.push({ userId: id });
      }
      if (started.length > 0) onDiff(started);
    }
    prevRoster = roster;
  });
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
  prevRoster = {};
  primed = false;
  lastStarted.clear();
  if (channel) {
    void channel.unsubscribe();
    channel = null;
  }
}

export function presenceJoined(): boolean {
  return channel != null;
}
