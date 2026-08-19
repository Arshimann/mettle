import type { Handler } from '@netlify/functions';

/**
 * ElevenLabs text-to-speech proxy.
 *
 * The whole reason this exists server-side: an API key shipped in the client
 * bundle is readable by anyone who opens DevTools. The key lives only in
 * Netlify's environment here.
 *
 * The client caches the returned audio in Supabase storage keyed by a content
 * hash, so a given article is synthesised once and then served from storage —
 * without that, every play would bill characters again.
 */

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
const MODEL = 'eleven_turbo_v2_5';
// Characters per request. The Playbook's longest article is comfortably under
// this; anything larger is a sign something is wrong, so reject rather than bill.
const MAX_CHARS = 5000;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    // Not an error the user should see as a crash — the client falls back to
    // the built-in browser voice when narration is unavailable.
    return { statusCode: 503, body: JSON.stringify({ error: 'tts-not-configured' }) };
  }

  let text: string;
  let voiceId: string;
  try {
    const body = JSON.parse(event.body || '{}');
    text = String(body.text ?? '').trim();
    voiceId = body.voiceId ? String(body.voiceId) : VOICE_ID;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'bad-json' }) };
  }

  if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'empty-text' }) };
  if (text.length > MAX_CHARS) {
    return { statusCode: 413, body: JSON.stringify({ error: 'too-long', max: MAX_CHARS }) };
  }

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: { stability: 0.4, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // Surface the status so the client can distinguish "out of credits" from
    // "misconfigured" and report it honestly instead of silently going quiet.
    return {
      statusCode: res.status,
      body: JSON.stringify({ error: 'elevenlabs-failed', status: res.status, detail: detail.slice(0, 300) }),
    };
  }

  const audio = Buffer.from(await res.arrayBuffer());
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    body: audio.toString('base64'),
    isBase64Encoded: true,
  };
};
