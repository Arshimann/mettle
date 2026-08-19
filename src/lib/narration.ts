import { supabase } from './supabase';

/**
 * ElevenLabs narration with a storage cache.
 *
 * Flow: hash the text → look for a cached MP3 in the `tts` bucket → if absent,
 * ask the Netlify function to synthesise it and store the result. The cache is
 * the whole economics of this: without it every play bills characters again.
 *
 * Everything degrades to `null`, and the caller falls back to the browser's
 * built-in voice — so no credits, no network, or no key simply means the old
 * reader, never a broken button.
 */

const BUCKET = 'tts';

/** Stable short hash of the text, so identical content reuses one file. */
async function hashText(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function cachedUrl(path: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 6);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export type NarrationFailure = 'unconfigured' | 'quota' | 'offline' | 'failed';

export interface NarrationResult {
  url: string | null;
  reason?: NarrationFailure;
}

/**
 * Resolve an audio URL for this text, generating and caching if needed.
 * Returns `{ url: null, reason }` when narration isn't available.
 */
export async function narrate(text: string, voiceId?: string): Promise<NarrationResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { url: null, reason: 'offline' };

  const hash = await hashText(`${voiceId ?? 'default'}:${text}`);
  const path = `${hash}.mp3`;

  // 1. Already synthesised? Serve it and spend nothing.
  const hit = await cachedUrl(path);
  if (hit) return { url: hit };

  // 2. Generate.
  let res: Response;
  try {
    res = await fetch('/.netlify/functions/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    });
  } catch {
    return { url: null, reason: 'offline' };
  }

  if (res.status === 503) return { url: null, reason: 'unconfigured' };
  if (res.status === 401 || res.status === 429) return { url: null, reason: 'quota' };
  if (!res.ok) return { url: null, reason: 'failed' };

  const blob = await res.blob();

  // 3. Cache for next time. A failure here is not fatal — we still have audio
  //    in hand for this play; it just costs again next time.
  if (supabase) {
    await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: 'audio/mpeg', upsert: true })
      .catch(() => undefined);
    const stored = await cachedUrl(path);
    if (stored) return { url: stored };
  }

  return { url: URL.createObjectURL(blob) };
}
