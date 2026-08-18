import { supabase } from './supabase';
import type { SocialResult } from './social';

/**
 * Physique board API. Mirrors social.ts conventions: every function no-ops
 * with ok:false when Supabase isn't configured, and weights stay canonical kg.
 */

export type PhysiquePose = 'front' | 'side' | 'back' | 'other';
export type PhysiqueVisibility = 'private' | 'friends';

export interface PhysiquePost {
  id: string;
  userId: string;
  takenOn: string;
  pose: PhysiquePose;
  caption: string | null;
  weightKg: number | null;
  visibility: PhysiqueVisibility;
  path: string;
  thumbPath: string;
  createdAt: string;
}

export interface PhysiqueReaction {
  postId: string;
  reactorId: string;
  emoji: string;
}

export interface PhysiqueComment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

const noClient: SocialResult<never> = { ok: false, message: 'Cloud is not set up' };

interface Row {
  id: string;
  user_id: string;
  taken_on: string;
  pose: PhysiquePose;
  caption: string | null;
  weight_kg: number | null;
  visibility: PhysiqueVisibility;
  path: string;
  thumb_path: string;
  created_at: string;
}

const toPost = (r: Row): PhysiquePost => ({
  id: r.id,
  userId: r.user_id,
  takenOn: r.taken_on,
  pose: r.pose,
  caption: r.caption,
  weightKg: r.weight_kg == null ? null : Number(r.weight_kg),
  visibility: r.visibility,
  path: r.path,
  thumbPath: r.thumb_path,
  createdAt: r.created_at,
});

/**
 * Downscale and re-encode before upload. Aspect ratio is preserved — a
 * physique photo must never be centre-cropped the way an avatar is — and EXIF
 * orientation is baked in so phone photos don't arrive sideways.
 */
async function encode(
  file: File,
  maxEdge: number,
  quality: number,
): Promise<{ blob: Blob; w: number; h: number } | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob =
    (await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality))) ??
    (await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality)));
  return blob ? { blob, w, h } : null;
}

/** Uploads both sizes, then writes the row — so a failed upload never leaves
 *  a post pointing at nothing. */
export async function createPost(
  userId: string,
  file: File,
  meta: {
    takenOn: string;
    pose: PhysiquePose;
    caption?: string;
    weightKg?: number | null;
    visibility: PhysiqueVisibility;
  },
): Promise<SocialResult<PhysiquePost>> {
  if (!supabase) return noClient;
  if (!/^image\//.test(file.type)) return { ok: false, message: 'Pick an image' };

  const full = await encode(file, 1080, 0.82);
  const thumb = await encode(file, 360, 0.7);
  if (!full || !thumb) return { ok: false, message: 'Could not read that image' };

  const id = crypto.randomUUID();
  const ext = full.blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${id}.${ext}`;
  const thumbPath = `${userId}/${id}_t.${ext}`;

  const up = await supabase.storage.from('physique').upload(path, full.blob, { contentType: full.blob.type });
  if (up.error) return { ok: false, message: up.error.message };
  const upT = await supabase.storage
    .from('physique')
    .upload(thumbPath, thumb.blob, { contentType: thumb.blob.type });
  if (upT.error) {
    await supabase.storage.from('physique').remove([path]);
    return { ok: false, message: upT.error.message };
  }

  const { data, error } = await supabase
    .from('physique_posts')
    .insert({
      id,
      user_id: userId,
      taken_on: meta.takenOn,
      pose: meta.pose,
      caption: meta.caption?.trim() || null,
      weight_kg: meta.weightKg ?? null,
      visibility: meta.visibility,
      path,
      thumb_path: thumbPath,
      width: full.w,
      height: full.h,
    })
    .select('*')
    .single();

  if (error) {
    await supabase.storage.from('physique').remove([path, thumbPath]);
    return { ok: false, message: error.message };
  }
  return { ok: true, data: toPost(data as Row) };
}

export async function setPostVisibility(postId: string, visibility: PhysiqueVisibility): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase.from('physique_posts').update({ visibility }).eq('id', postId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/** Row first, then the objects: once the row is gone nobody can read the
 *  bytes, so a failed object delete leaves junk rather than a leak. */
export async function deletePost(post: PhysiquePost): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase.from('physique_posts').delete().eq('id', post.id);
  if (error) return { ok: false, message: error.message };
  await supabase.storage.from('physique').remove([post.path, post.thumbPath]);
  return { ok: true };
}

export async function fetchMyPosts(userId: string, limit = 60): Promise<SocialResult<PhysiquePost[]>> {
  if (!supabase) return noClient;
  const { data, error } = await supabase
    .from('physique_posts')
    .select('*')
    .eq('user_id', userId)
    .order('taken_on', { ascending: false })
    .limit(limit);
  if (error) return { ok: false, message: error.message };
  return { ok: true, data: (data as Row[]).map(toPost) };
}

/** The board: friends' shared posts. RLS is the real gate; the id list just
 *  narrows the query. */
export async function fetchBoard(friendIds: string[], limit = 30): Promise<SocialResult<PhysiquePost[]>> {
  if (!supabase) return noClient;
  if (friendIds.length === 0) return { ok: true, data: [] };
  const { data, error } = await supabase
    .from('physique_posts')
    .select('*')
    .in('user_id', friendIds)
    .eq('visibility', 'friends')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { ok: false, message: error.message };
  return { ok: true, data: (data as Row[]).map(toPost) };
}

export async function fetchPhysiqueReactions(postIds: string[]): Promise<SocialResult<PhysiqueReaction[]>> {
  if (!supabase) return noClient;
  if (postIds.length === 0) return { ok: true, data: [] };
  const { data, error } = await supabase
    .from('physique_reactions')
    .select('post_id, reactor_id, emoji')
    .in('post_id', postIds);
  if (error) return { ok: false, message: error.message };
  type R = { post_id: string; reactor_id: string; emoji: string };
  return {
    ok: true,
    data: (data as R[]).map((r) => ({ postId: r.post_id, reactorId: r.reactor_id, emoji: r.emoji })),
  };
}

export async function setPhysiqueReaction(postId: string, reactorId: string, emoji: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase
    .from('physique_reactions')
    .upsert({ post_id: postId, reactor_id: reactorId, emoji }, { onConflict: 'post_id,reactor_id' });
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function clearPhysiqueReaction(postId: string, reactorId: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase
    .from('physique_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('reactor_id', reactorId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function fetchPhysiqueComments(postId: string): Promise<SocialResult<PhysiqueComment[]>> {
  if (!supabase) return noClient;
  const { data, error } = await supabase
    .from('physique_comments')
    .select('id, post_id, author_id, body, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) return { ok: false, message: error.message };
  type C = { id: string; post_id: string; author_id: string; body: string; created_at: string };
  return {
    ok: true,
    data: (data as C[]).map((c) => ({
      id: c.id,
      postId: c.post_id,
      authorId: c.author_id,
      body: c.body,
      createdAt: c.created_at,
    })),
  };
}

export async function addPhysiqueComment(postId: string, authorId: string, body: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const text = body.trim().slice(0, 500);
  if (!text) return { ok: false, message: 'Empty comment' };
  const { error } = await supabase
    .from('physique_comments')
    .insert({ post_id: postId, author_id: authorId, body: text });
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function deletePhysiqueComment(commentId: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase.from('physique_comments').delete().eq('id', commentId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/** Wipe every post and object for a user — reset-data and unpublish. */
export async function deleteAllPosts(userId: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const mine = await fetchMyPosts(userId, 500);
  if (mine.ok && mine.data?.length) {
    await supabase.storage.from('physique').remove(mine.data.flatMap((p) => [p.path, p.thumbPath]));
  }
  const { error } = await supabase.from('physique_posts').delete().eq('user_id', userId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

/** Pull every shared post of yours back to private, in one go. */
export async function makeAllPrivate(userId: string): Promise<SocialResult> {
  if (!supabase) return noClient;
  const { error } = await supabase
    .from('physique_posts')
    .update({ visibility: 'private' })
    .eq('user_id', userId);
  return error ? { ok: false, message: error.message } : { ok: true };
}

// ---- signed URLs -----------------------------------------------------------
// The bucket is private, so display URLs are signed and expire. They're cached
// and batch-minted, one round trip per screenful.

interface CacheEntry {
  url: string;
  expiresAt: number;
}
const urlCache = new Map<string, CacheEntry>();
const TTL_SEC = 3600;
const MARGIN_MS = 5 * 60_000;

export async function signedUrls(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!supabase || paths.length === 0) return out;
  const now = Date.now();
  const missing: string[] = [];
  for (const p of paths) {
    const hit = urlCache.get(p);
    if (hit && hit.expiresAt - MARGIN_MS > now) out.set(p, hit.url);
    else missing.push(p);
  }
  if (missing.length > 0) {
    const { data } = await supabase.storage.from('physique').createSignedUrls(missing, TTL_SEC);
    for (const row of data ?? []) {
      if (row.signedUrl && row.path) {
        urlCache.set(row.path, { url: row.signedUrl, expiresAt: now + TTL_SEC * 1000 });
        out.set(row.path, row.signedUrl);
      }
    }
  }
  return out;
}

export function clearSignedUrls(): void {
  urlCache.clear();
}
