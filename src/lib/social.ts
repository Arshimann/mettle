import { supabase } from './supabase';
import { deleteAllPosts } from './physique';
import { encodeImage } from './imageEncode';
import { useStore } from '../store/useStore';
import { computeStreak } from './formulas';
import { todayStr, addDays, fromISO, toISO } from './date';
import type { HistoryEntry } from '../types';
import type {
  FriendProfileData,
  FriendRequestRow,
  FriendSummary,
  FriendWorkout,
  MyShared,
  SharedPrivacy,
  WorkoutComment,
  WorkoutReaction,
} from '../types/social';
import { DEFAULT_PRIVACY } from '../types/social';

/**
 * Social API layer — normalized Supabase rows, entirely separate from the
 * whole-blob sync in sync.ts. Every function no-ops (ok:false) when Supabase
 * is unconfigured, mirroring sync.ts.
 */

export interface SocialResult<T = void> {
  ok: boolean;
  message?: string;
  data?: T;
}

const noClient: SocialResult<never> = { ok: false, message: 'Cloud is not set up' };

/* ------------------------------------------------------------------ */
/* Row mapping                                                         */
/* ------------------------------------------------------------------ */

interface SharedProfileRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  share_code: string;
  streak: number;
  trained_dates: string[];
  prs: FriendProfileData['prs'];
  custom_exercises: FriendProfileData['customExercises'];
  split: FriendProfileData['split'];
  privacy: SharedPrivacy;
}

const toMyShared = (r: SharedProfileRow): MyShared => ({
  userId: r.user_id,
  displayName: r.display_name,
  avatarUrl: r.avatar_url,
  shareCode: r.share_code,
  privacy: { ...DEFAULT_PRIVACY, ...(r.privacy ?? {}) },
});

const toFriendProfile = (r: SharedProfileRow): FriendProfileData => ({
  userId: r.user_id,
  displayName: r.display_name ?? 'Lifter',
  avatarUrl: r.avatar_url,
  streak: r.streak ?? 0,
  trainedDates: Array.isArray(r.trained_dates) ? r.trained_dates : [],
  prs: Array.isArray(r.prs) ? r.prs : [],
  customExercises: Array.isArray(r.custom_exercises) ? r.custom_exercises : [],
  split: Array.isArray(r.split) ? r.split : null,
});

/* ------------------------------------------------------------------ */
/* Own shared profile                                                  */
/* ------------------------------------------------------------------ */

// No 0/O/1/I/L — codes get read out loud across a gym floor.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const genShareCode = () =>
  Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');

/** Fetch my shared row, creating it (with a fresh share code) on first run. */
export async function ensureSharedProfile(userId: string): Promise<SocialResult<MyShared>> {
  if (!supabase) return noClient;
  const { data, error } = await supabase.from('shared_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (data) return { ok: true, data: toMyShared(data as SharedProfileRow) };

  // First run — insert with a unique share code (retry on collision).
  for (let attempt = 0; attempt < 5; attempt++) {
    const share_code = genShareCode();
    const { data: created, error: insErr } = await supabase
      .from('shared_profiles')
      .insert({ user_id: userId, share_code })
      .select('*')
      .single();
    if (!insErr) return { ok: true, data: toMyShared(created as SharedProfileRow) };
    if (!insErr.message.includes('duplicate') && insErr.code !== '23505') {
      return { ok: false, message: insErr.message };
    }
  }
  return { ok: false, message: 'Could not allocate a share code' };
}

/** Recompute + upload my public snapshot, honoring privacy at publish time. */
export async function publishSharedProfile(userId: string, privacy: SharedPrivacy): Promise<SocialResult> {
  if (!supabase) return noClient;
  const s = useStore.getState();

  const cutoff = toISO(addDays(fromISO(todayStr()), -84));
  const trained_dates = [...new Set(s.history.map((h) => h.date))].filter((d) => d >= cutoff).sort();

  const prs = privacy.shareWorkouts
    ? s.prs.map((p) => ({ exercise: p.exercise, weight: p.weight, reps: p.reps, date: p.date }))
    : [];
  const split = privacy.shareSplit
    ? s.split.map((d) => ({ name: d.name, exercises: d.exercises }))
    : null;
  const custom_exercises = privacy.shareSplit
    ? s.customExercises.map((e) => ({ name: e.name, group: e.group }))
    : [];

  const { error } = await supabase
    .from('shared_profiles')
    .update({
      streak: computeStreak(s.history),
      trained_dates,
      prs,
      custom_exercises,
      split,
      privacy,
    })
    .eq('user_id', userId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function updateDisplayName(userId: string, displayName: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const name = displayName.trim();
  if (name.length < 2 || name.length > 24) return { ok: false, message: 'Name must be 2–24 characters' };
  const { error } = await supabase.from('shared_profiles').update({ display_name: name }).eq('user_id', userId);
  if (error) {
    if (error.code === '23505' || error.message.includes('duplicate')) {
      return { ok: false, message: 'That name is taken' };
    }
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Workouts                                                            */
/* ------------------------------------------------------------------ */

export async function publishWorkout(
  userId: string,
  entry: HistoryEntry,
  prNames: string[],
): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase.from('workouts').upsert(
    {
      user_id: userId,
      client_id: entry.id,
      date: entry.date,
      day_name: entry.dayName,
      exercises: entry.exercises,
      duration_sec: entry.durationSec ?? null,
      pr_names: prNames,
    },
    { onConflict: 'user_id,client_id' },
  );
  return error ? { ok: false, message: error.message } : { ok: true };
}

/**
 * Once per sign-in: reconcile local history with published rows — upload
 * missing workouts (newest 100) and delete cloud orphans whose local entry is
 * gone. With sharing off, wipes every published row instead.
 */
export async function backfillWorkouts(userId: string, privacy: SharedPrivacy): Promise<SocialResult> {
  if (!supabase) return noClient;
  if (!privacy.shareWorkouts) {
    const { error } = await supabase.from('workouts').delete().eq('user_id', userId);
    return error ? { ok: false, message: error.message } : { ok: true };
  }

  const { data: cloudRows, error } = await supabase.from('workouts').select('client_id').eq('user_id', userId);
  if (error) return { ok: false, message: error.message };
  const cloudIds = new Set((cloudRows ?? []).map((r) => r.client_id as string));

  const history = useStore.getState().history;
  const localIds = new Set(history.map((h) => h.id));

  const missing = history.filter((h) => !cloudIds.has(h.id)).slice(0, 100);
  for (let i = 0; i < missing.length; i += 50) {
    const chunk = missing.slice(i, i + 50).map((h) => ({
      user_id: userId,
      client_id: h.id,
      date: h.date,
      day_name: h.dayName,
      exercises: h.exercises,
      duration_sec: h.durationSec ?? null,
      pr_names: [],
    }));
    const { error: upErr } = await supabase.from('workouts').upsert(chunk, { onConflict: 'user_id,client_id' });
    if (upErr) return { ok: false, message: upErr.message };
  }

  const orphans = [...cloudIds].filter((id) => !localIds.has(id));
  if (orphans.length > 0) {
    await supabase.from('workouts').delete().eq('user_id', userId).in('client_id', orphans);
  }
  return { ok: true };
}

/** Remove everything social about me (reset-data / sharing turned off). */
export async function unpublishAll(userId: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  await supabase.from('workouts').delete().eq('user_id', userId);
  // Physique photos are the most sensitive thing here — wipe them too.
  await deleteAllPosts(userId);
  const { error } = await supabase
    .from('shared_profiles')
    .update({ streak: 0, trained_dates: [], prs: [], custom_exercises: [], split: null })
    .eq('user_id', userId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/* ------------------------------------------------------------------ */
/* Friends                                                             */
/* ------------------------------------------------------------------ */

export async function searchProfiles(
  q: string,
): Promise<SocialResult<{ userId: string; displayName: string; avatarUrl: string | null }[]>> {
  if (!supabase) return noClient;
  const { data, error } = await supabase.rpc('search_profiles', { q });
  if (error) return { ok: false, message: error.message };
  type Row = { user_id: string; display_name: string; avatar_url: string | null };
  return {
    ok: true,
    data: ((data ?? []) as Row[]).map((r) => ({
      userId: r.user_id,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
    })),
  };
}

export async function sendFriendRequest(userId: string, toId: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase.from('friend_requests').insert({ from_id: userId, to_id: toId });
  if (error) {
    if (error.code === '23505') return { ok: true }; // already pending — treat as sent
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function acceptFriendRequest(requestId: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase.rpc('accept_friend_request', { req: requestId });
  return error ? { ok: false, message: error.message } : { ok: true };
}

/** Decline (as recipient) or cancel (as sender) — same delete. */
export async function deleteFriendRequest(requestId: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase.from('friend_requests').delete().eq('id', requestId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function removeFriend(userId: string, friendId: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`,
    );
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function fetchFriends(userId: string): Promise<SocialResult<FriendSummary[]>> {
  if (!supabase) return noClient;
  const { data: rows, error } = await supabase.from('friendships').select('friend_id').eq('user_id', userId);
  if (error) return { ok: false, message: error.message };
  const ids = (rows ?? []).map((r) => r.friend_id as string);
  if (ids.length === 0) return { ok: true, data: [] };

  const { data: profiles, error: pErr } = await supabase
    .from('shared_profiles')
    .select('user_id, display_name, avatar_url, streak')
    .in('user_id', ids);
  if (pErr) return { ok: false, message: pErr.message };
  return {
    ok: true,
    data: ((profiles ?? []) as SharedProfileRow[])
      .map((r) => ({
        userId: r.user_id,
        displayName: r.display_name ?? 'Lifter',
        avatarUrl: r.avatar_url,
        streak: r.streak ?? 0,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName)),
  };
}

export async function fetchRequests(
  userId: string,
): Promise<SocialResult<{ incoming: FriendRequestRow[]; outgoing: FriendRequestRow[] }>> {
  if (!supabase) return noClient;
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id, from_id, to_id')
    .or(`from_id.eq.${userId},to_id.eq.${userId}`);
  if (error) return { ok: false, message: error.message };

  type ReqRow = { id: string; from_id: string; to_id: string };
  const reqs = (data ?? []) as ReqRow[];
  const otherIds = [...new Set(reqs.map((r) => (r.from_id === userId ? r.to_id : r.from_id)))];
  const names = new Map<string, { displayName: string; avatarUrl: string | null }>();
  if (otherIds.length > 0) {
    // A pending requester isn't a friend yet, so sp_select won't let us read
    // their row — which is why requests used to show "Lifter". This RPC is
    // security-definer and returns name + avatar only for people already in a
    // request relationship with us.
    const { data: pending } = await supabase.rpc('pending_request_profiles');
    type P = { user_id: string; display_name: string | null; avatar_url: string | null };
    for (const p of (pending ?? []) as P[]) {
      if (p.display_name) names.set(p.user_id, { displayName: p.display_name, avatarUrl: p.avatar_url });
    }

    // Friends we can already read directly — covers anyone the RPC missed.
    const missing = otherIds.filter((id) => !names.has(id));
    if (missing.length > 0) {
      const { data: profiles } = await supabase
        .from('shared_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', missing);
      for (const p of (profiles ?? []) as SharedProfileRow[]) {
        names.set(p.user_id, { displayName: p.display_name ?? 'Lifter', avatarUrl: p.avatar_url });
      }
    }
  }
  const decorate = (r: ReqRow): FriendRequestRow => {
    const other = r.from_id === userId ? r.to_id : r.from_id;
    const info = names.get(other);
    return {
      id: r.id,
      fromId: r.from_id,
      toId: r.to_id,
      displayName: info?.displayName ?? 'Lifter',
      avatarUrl: info?.avatarUrl ?? null,
    };
  };
  return {
    ok: true,
    data: {
      incoming: reqs.filter((r) => r.to_id === userId).map(decorate),
      outgoing: reqs.filter((r) => r.from_id === userId).map(decorate),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Friend content                                                      */
/* ------------------------------------------------------------------ */

export async function fetchFriendProfile(friendId: string): Promise<SocialResult<FriendProfileData>> {
  if (!supabase) return noClient;
  const { data, error } = await supabase
    .from('shared_profiles')
    .select('*')
    .eq('user_id', friendId)
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: 'Profile not found' };
  return { ok: true, data: toFriendProfile(data as SharedProfileRow) };
}

export async function fetchFriendWorkouts(
  friendId: string,
  limit = 20,
): Promise<SocialResult<FriendWorkout[]>> {
  if (!supabase) return noClient;
  const { data, error } = await supabase
    .from('workouts')
    .select('client_id, user_id, date, day_name, exercises, duration_sec, pr_names')
    .eq('user_id', friendId)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) return { ok: false, message: error.message };
  type Row = {
    client_id: string;
    user_id: string;
    date: string;
    day_name: string | null;
    exercises: FriendWorkout['exercises'];
    duration_sec: number | null;
    pr_names: string[] | null;
  };
  return {
    ok: true,
    data: ((data ?? []) as Row[]).map((r) => ({
      key: r.client_id,
      userId: r.user_id,
      date: r.date,
      dayName: r.day_name ?? 'Workout',
      exercises: r.exercises ?? [],
      durationSec: r.duration_sec,
      prNames: r.pr_names ?? [],
    })),
  };
}

/** One feed across every friend, newest first — the activity view. Fetching
 *  per-friend would be N round trips for the same rows. */
export async function fetchFriendsFeed(
  friendIds: string[],
  limit = 20,
): Promise<SocialResult<FriendWorkout[]>> {
  if (!supabase) return noClient;
  if (friendIds.length === 0) return { ok: true, data: [] };
  const { data, error } = await supabase
    .from('workouts')
    .select('client_id, user_id, date, day_name, exercises, duration_sec, pr_names')
    .in('user_id', friendIds)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) return { ok: false, message: error.message };
  type Row = {
    client_id: string;
    user_id: string;
    date: string;
    day_name: string | null;
    exercises: FriendWorkout['exercises'];
    duration_sec: number | null;
    pr_names: string[] | null;
  };
  return {
    ok: true,
    data: ((data ?? []) as Row[]).map((r) => ({
      key: r.client_id,
      userId: r.user_id,
      date: r.date,
      dayName: r.day_name ?? 'Workout',
      exercises: r.exercises ?? [],
      durationSec: r.duration_sec,
      prNames: r.pr_names ?? [],
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Reactions & comments                                                */
/* ------------------------------------------------------------------ */

export async function fetchReactions(
  ownerId: string,
  keys: string[],
): Promise<SocialResult<WorkoutReaction[]>> {
  if (!supabase) return noClient;
  if (keys.length === 0) return { ok: true, data: [] };
  const { data, error } = await supabase
    .from('workout_reactions')
    .select('workout_key, reactor_id, emoji')
    .eq('profile_id', ownerId)
    .in('workout_key', keys);
  if (error) return { ok: false, message: error.message };
  type Row = { workout_key: string; reactor_id: string; emoji: string };
  return {
    ok: true,
    data: ((data ?? []) as Row[]).map((r) => ({
      workoutKey: r.workout_key,
      reactorId: r.reactor_id,
      emoji: r.emoji,
    })),
  };
}

export async function setReaction(
  ownerId: string,
  workoutKey: string,
  reactorId: string,
  emoji: string,
): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase.from('workout_reactions').upsert(
    { profile_id: ownerId, workout_key: workoutKey, reactor_id: reactorId, emoji },
    { onConflict: 'profile_id,workout_key,reactor_id' },
  );
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function clearReaction(
  ownerId: string,
  workoutKey: string,
  reactorId: string,
): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase
    .from('workout_reactions')
    .delete()
    .eq('profile_id', ownerId)
    .eq('workout_key', workoutKey)
    .eq('reactor_id', reactorId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function fetchComments(
  ownerId: string,
  workoutKey: string,
): Promise<SocialResult<WorkoutComment[]>> {
  if (!supabase) return noClient;
  const { data, error } = await supabase
    .from('workout_comments')
    .select('id, workout_key, author_id, body, created_at')
    .eq('profile_id', ownerId)
    .eq('workout_key', workoutKey)
    .order('created_at', { ascending: true });
  if (error) return { ok: false, message: error.message };
  type Row = { id: string; workout_key: string; author_id: string; body: string; created_at: string };
  return {
    ok: true,
    data: ((data ?? []) as Row[]).map((r) => ({
      id: r.id,
      workoutKey: r.workout_key,
      authorId: r.author_id,
      body: r.body,
      createdAt: r.created_at,
    })),
  };
}

export async function addComment(
  ownerId: string,
  workoutKey: string,
  authorId: string,
  body: string,
): Promise<SocialResult> {
  if (!supabase) return noClient;
  const text = body.trim().slice(0, 500);
  if (!text) return { ok: false, message: 'Empty comment' };
  const { error } = await supabase
    .from('workout_comments')
    .insert({ profile_id: ownerId, workout_key: workoutKey, author_id: authorId, body: text });
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deleteComment(commentId: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase.from('workout_comments').delete().eq('id', commentId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/* ------------------------------------------------------------------ */
/* Avatar upload                                                       */
/* ------------------------------------------------------------------ */

/** Crop-center + resize to 256×256, webp (jpeg fallback), then upload. */
export async function uploadAvatar(userId: string, file: File): Promise<SocialResult<string>> {
  if (!supabase) return noClient;
  // Accept anything the browser calls an image, including HEIC straight off an
  // iPhone camera — it gets re-encoded below regardless of what came in.
  if (!file.type.startsWith('image/')) {
    return { ok: false, message: 'Pick an image' };
  }

  const encoded = await encodeImage(file, { maxEdge: 256, quality: 0.85, mode: 'cover' });
  if (!encoded) return { ok: false, message: 'Could not read that image' };

  // Extension and content type both come from what the encoder ACTUALLY
  // produced — asking for webp can silently yield png on Safari.
  const path = `${userId}/avatar.${encoded.ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, encoded.blob, { upsert: true, contentType: encoded.type });
  if (error) return { ok: false, message: error.message };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;
  const { error: updErr } = await supabase
    .from('shared_profiles')
    .update({ avatar_url: url })
    .eq('user_id', userId);
  if (updErr) return { ok: false, message: updErr.message };
  return { ok: true, data: url };
}

export async function updatePrivacy(userId: string, privacy: SharedPrivacy): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase.from('shared_profiles').update({ privacy }).eq('user_id', userId);
  return error ? { ok: false, message: error.message } : { ok: true };
}
