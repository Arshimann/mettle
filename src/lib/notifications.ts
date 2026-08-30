import { supabase } from './supabase';
import { useStore } from '../store/useStore';
import { useSocial } from '../store/useSocial';
import { fetchRequests, UNKNOWN_NAME } from './social';

/**
 * Where notifications come from.
 *
 * The catch-up fetch is the source of truth: everything is derived from rows
 * that already exist, filtered to "aimed at me, newer than my watermark".
 * Realtime is only an accelerator that triggers the same fetch — so if the
 * publication isn't applied, or the connection drops, nothing breaks; the app
 * just falls back to polling.
 */

export type NotificationKind =
  | 'reaction'
  | 'comment'
  | 'friend-request'
  | 'friend-training'
  | 'physique-reaction'
  | 'physique-comment';

export interface AppNotification {
  /** Content-derived, so refetching can't duplicate an item. */
  id: string;
  kind: NotificationKind;
  createdAt: string;
  actorId: string;
  actorName: string;
  actorAvatar: string | null;
  /** Workout or physique post this refers to. */
  subjectKey?: string;
  subjectLabel?: string;
  preview?: string;
  requestId?: string;
  read: boolean;
}

const nameOf = (id: string) => {
  const f = useSocial.getState().friends.find((x) => x.userId === id);
  return { name: f?.displayName ?? UNKNOWN_NAME, avatar: f?.avatarUrl ?? null };
};

/** Workout context comes from local history — workout_key is HistoryEntry.id,
 *  so this costs zero network. */
const workoutLabel = (key: string) => {
  const h = useStore.getState().history.find((x) => x.id === key);
  return h ? h.dayName : 'your workout';
};

export async function fetchNotificationsSince(
  userId: string,
  sinceISO: string,
): Promise<{ ok: boolean; data: AppNotification[]; message?: string }> {
  if (!supabase) return { ok: false, data: [], message: 'Cloud is not set up' };

  const [reactions, comments, requests, physique] = await Promise.all([
    supabase
      .from('workout_reactions')
      .select('workout_key, reactor_id, emoji, created_at')
      .eq('profile_id', userId)
      .neq('reactor_id', userId)
      .gt('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('workout_comments')
      .select('id, workout_key, author_id, body, created_at')
      .eq('profile_id', userId)
      .neq('author_id', userId)
      .gt('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .limit(50),
    fetchRequests(userId),
    supabase.rpc('physique_notifications', { since: sinceISO }),
  ]);

  const out: AppNotification[] = [];

  type RxRow = { workout_key: string; reactor_id: string; emoji: string; created_at: string };
  for (const r of (reactions.data ?? []) as RxRow[]) {
    const who = nameOf(r.reactor_id);
    out.push({
      id: `reaction:${r.workout_key}:${r.reactor_id}`,
      kind: 'reaction',
      createdAt: r.created_at,
      actorId: r.reactor_id,
      actorName: who.name,
      actorAvatar: who.avatar,
      subjectKey: r.workout_key,
      subjectLabel: workoutLabel(r.workout_key),
      preview: r.emoji,
      read: false,
    });
  }

  type CmRow = { id: string; workout_key: string; author_id: string; body: string; created_at: string };
  for (const c of (comments.data ?? []) as CmRow[]) {
    const who = nameOf(c.author_id);
    out.push({
      id: `comment:${c.id}`,
      kind: 'comment',
      createdAt: c.created_at,
      actorId: c.author_id,
      actorName: who.name,
      actorAvatar: who.avatar,
      subjectKey: c.workout_key,
      subjectLabel: workoutLabel(c.workout_key),
      preview: c.body.slice(0, 80),
      read: false,
    });
  }

  if (requests.ok && requests.data) {
    for (const r of requests.data.incoming) {
      out.push({
        id: `req:${r.id}`,
        kind: 'friend-request',
        // fetchRequests doesn't surface created_at; the watermark still works
        // because the id is stable and dedupe is by id.
        createdAt: new Date().toISOString(),
        actorId: r.fromId,
        actorName: r.displayName,
        actorAvatar: r.avatarUrl,
        requestId: r.id,
        read: false,
      });
    }
  }

  type PhRow = {
    kind: 'reaction' | 'comment';
    id: string | null;
    post_id: string;
    actor_id: string;
    body: string;
    created_at: string;
  };
  for (const p of (physique.data ?? []) as PhRow[]) {
    const who = nameOf(p.actor_id);
    out.push({
      id: p.kind === 'comment' ? `physcomment:${p.id}` : `physreact:${p.post_id}:${p.actor_id}`,
      kind: p.kind === 'comment' ? 'physique-comment' : 'physique-reaction',
      createdAt: p.created_at,
      actorId: p.actor_id,
      actorName: who.name,
      actorAvatar: who.avatar,
      subjectKey: p.post_id,
      subjectLabel: 'your check-in',
      preview: p.kind === 'comment' ? p.body.slice(0, 80) : p.body,
      read: false,
    });
  }

  out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ok: true, data: out };
}

/**
 * Live nudge. Every event just calls onBump — one debounced path back into the
 * same fetch, so live and catch-up can never disagree.
 */
export function subscribeNotifications(
  userId: string,
  onBump: () => void,
  onStatus: (live: boolean) => void,
): () => void {
  if (!supabase) {
    onStatus(false);
    return () => {};
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  const bump = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onBump, 1200);
  };

  const channel = supabase
    .channel(`notif:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'workout_reactions', filter: `profile_id=eq.${userId}` },
      bump,
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'workout_comments', filter: `profile_id=eq.${userId}` },
      bump,
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'friend_requests', filter: `to_id=eq.${userId}` },
      bump,
    )
    // Physique rows aren't filterable by owner (they key off a post), so these
    // fire for any insert the subscriber is allowed to see and the fetch sorts
    // out what's actually mine.
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'physique_reactions' }, bump)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'physique_comments' }, bump)
    .subscribe((status) => onStatus(status === 'SUBSCRIBED'));

  return () => {
    if (timer) clearTimeout(timer);
    void channel.unsubscribe();
  };
}
