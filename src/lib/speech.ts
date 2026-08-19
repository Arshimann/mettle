/**
 * Text-to-speech for the Playbook, on the browser's built-in speechSynthesis.
 *
 * Four things reliably break naive usage, and each is handled here:
 *  · iOS only starts speech from inside a user gesture, so speak() never
 *    awaits anything before calling synth.speak().
 *  · getVoices() populates asynchronously and Safari's voiceschanged is
 *    unreliable — listVoices() polls with a deadline and caches.
 *  · Chrome silently kills utterances after ~15s, so text is spoken as short
 *    chunks, which also gives progress and instant stop for free.
 *  · pause()/resume() are unreliable on iOS and several Androids, so they're
 *    implemented as cancel + replay-from-chunk instead.
 */

export type SpeechState = 'idle' | 'speaking' | 'paused' | 'unsupported';

export interface SpeechVoice {
  id: string;
  label: string;
  lang: string;
  /** Higher is better. Drives the default pick and the picker's order. */
  score: number;
}

/**
 * Ranks the voices a device offers. Platforms ship a wide quality range under
 * one API — iOS "Compact" voices are the tinny ones people mean by "robotic",
 * while Enhanced/Premium/Neural variants sound markedly better and are usually
 * present but never chosen by default. Picking well is the single biggest
 * quality lever available without a paid service.
 */
function scoreVoice(v: SpeechSynthesisVoice, prefLang: string): number {
  const name = v.name.toLowerCase();
  let score = 0;

  // Language match first — a great voice in the wrong language is useless.
  if (v.lang.toLowerCase().startsWith(prefLang)) score += 100;
  else if (v.lang.toLowerCase().startsWith(prefLang.slice(0, 2))) score += 60;

  // Quality tiers, by the naming conventions the platforms actually use.
  if (/premium|enhanced|neural|natural/.test(name)) score += 40;
  if (/siri/.test(name)) score += 30;
  if (/google/.test(name)) score += 25;
  // iOS "Compact" voices are the low-bandwidth ones — actively avoid them.
  if (/compact/.test(name)) score -= 40;
  if (/eloquence|novelty|whisper|bells|bubbles|organ|zarvox|trinoids/.test(name)) score -= 60;

  // Local voices don't stall waiting on a network round trip.
  if (v.localService) score += 10;
  if (v.default) score += 5;

  return score;
}

export interface SpeechSnapshot {
  state: SpeechState;
  chunk: number;
  chunks: number;
}

const synth: SpeechSynthesis | null =
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

let queue: string[] = [];
let index = 0;
let state: SpeechState = synth ? 'idle' : 'unsupported';
let token = 0; // invalidates in-flight utterances after a stop
let voiceCache: SpeechSynthesisVoice[] | null = null;
let onEndAll: (() => void) | null = null;

const listeners = new Set<(s: SpeechSnapshot) => void>();
const snapshot = (): SpeechSnapshot => ({ state, chunks: queue.length, chunk: index });
const emit = () => {
  const s = snapshot();
  listeners.forEach((fn) => fn(s));
};

/** Split on sentence boundaries, keeping each utterance short. */
export function splitForSpeech(text: string, max = 180): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  const out: string[] = [];
  let buf = '';
  for (const s of sentences) {
    if (buf && buf.length + s.length + 1 > max) {
      out.push(buf);
      buf = s;
    } else {
      buf = buf ? `${buf} ${s}` : s;
    }
    // A single sentence longer than max still has to be broken up.
    while (buf.length > max) {
      const cut = buf.lastIndexOf(' ', max);
      out.push(buf.slice(0, cut > 0 ? cut : max));
      buf = buf.slice(cut > 0 ? cut + 1 : max);
    }
  }
  if (buf) out.push(buf);
  return out;
}

function speakFrom(i: number, voiceId: string | null, rate: number) {
  if (!synth || i >= queue.length) {
    if (i >= queue.length && queue.length > 0) {
      state = 'idle';
      index = 0;
      emit();
      onEndAll?.();
    }
    return;
  }
  const mine = token;
  index = i;
  const u = new SpeechSynthesisUtterance(queue[i]);
  u.rate = rate;
  // A hair above neutral. The dead-flat default pitch is a large part of why
  // stock TTS reads as robotic.
  u.pitch = 1.05;
  // No explicit choice means take the best one available rather than whatever
  // the platform happens to default to — often a low-bandwidth "Compact" voice.
  const wanted = voiceId ?? bestVoiceId();
  if (wanted && voiceCache) {
    const v = voiceCache.find((x) => x.voiceURI === wanted);
    if (v) {
      u.voice = v;
      // Match the utterance language to the voice, or the engine can layer a
      // mismatched accent on top of it.
      u.lang = v.lang;
    }
  }
  u.onend = () => {
    if (mine !== token) return; // cancelled — don't resurrect the queue
    speakFrom(i + 1, voiceId, rate);
  };
  u.onerror = () => {
    if (mine !== token) return;
    state = 'idle';
    emit();
  };
  state = 'speaking';
  emit();
  synth.speak(u);
}

export const speech = {
  supported: () => synth != null,

  /** Resolves once voices exist, or after a short deadline. Cached. */
  async listVoices(): Promise<SpeechVoice[]> {
    if (!synth) return [];
    if (voiceCache?.length) return voiceCache.map(toVoice).sort((a, b) => b.score - a.score);
    voiceCache = synth.getVoices();
    if (voiceCache.length === 0) {
      await new Promise<void>((resolve) => {
        const deadline = Date.now() + 1500;
        const poll = () => {
          voiceCache = synth.getVoices();
          if (voiceCache.length > 0 || Date.now() > deadline) resolve();
          else setTimeout(poll, 50);
        };
        synth.addEventListener('voiceschanged', () => resolve(), { once: true });
        poll();
      });
      voiceCache = synth.getVoices();
    }
    return voiceCache.map(toVoice);
  },

  /** MUST be called synchronously from a user gesture on iOS. */
  speak(text: string, opts: { voiceId?: string | null; rate?: number; onEnd?: () => void } = {}) {
    if (!synth) return;
    token++;
    synth.cancel();
    queue = splitForSpeech(text);
    onEndAll = opts.onEnd ?? null;
    speakFrom(0, opts.voiceId ?? null, opts.rate ?? 1);
  },

  /** Cancel and remember where we were — resume replays the current chunk. */
  pause() {
    if (!synth || state !== 'speaking') return;
    token++;
    synth.cancel();
    state = 'paused';
    emit();
  },

  resume(opts: { voiceId?: string | null; rate?: number } = {}) {
    if (!synth || state !== 'paused') return;
    token++;
    speakFrom(index, opts.voiceId ?? null, opts.rate ?? 1);
  },

  stop() {
    if (!synth) return;
    token++;
    synth.cancel();
    queue = [];
    index = 0;
    state = 'idle';
    onEndAll = null;
    emit();
  },

  subscribe(fn: (s: SpeechSnapshot) => void): () => void {
    listeners.add(fn);
    fn(snapshot());
    return () => listeners.delete(fn);
  },

  getSnapshot: snapshot,
};

const prefLang = () => (typeof navigator !== 'undefined' ? navigator.language : 'en-US').toLowerCase();

const toVoice = (v: SpeechSynthesisVoice): SpeechVoice => ({
  id: v.voiceURI,
  label: v.name,
  lang: v.lang,
  score: scoreVoice(v, prefLang()),
});

/** The best voice this device offers, or null before any have loaded. */
export function bestVoiceId(): string | null {
  if (!voiceCache?.length) return null;
  return [...voiceCache].map(toVoice).sort((a, b) => b.score - a.score)[0]?.id ?? null;
}

// Speech keeps going when a PWA is backgrounded on iOS — stop it instead.
if (typeof window !== 'undefined' && synth) {
  const kill = () => speech.stop();
  window.addEventListener('pagehide', kill);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') kill();
  });
}
