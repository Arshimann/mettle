/**
 * Text-to-speech for the Playbook, on the browser's built-in speechSynthesis.
 *
 * Five things reliably break naive usage, and each is handled here:
 *  · iOS only starts speech from inside a user gesture, so speak() never
 *    awaits anything before calling synth.speak().
 *  · getVoices() populates asynchronously and Safari's voiceschanged is
 *    unreliable — listVoices() polls with a deadline and caches.
 *  · Chrome silently kills utterances after ~15s, so text is spoken as short
 *    chunks, which also gives progress and instant stop for free.
 *  · pause()/resume() are unreliable on iOS and several Androids, so they're
 *    implemented as cancel + replay-from-chunk instead.
 *  · Rate and voice cannot be changed on an utterance that is already
 *    speaking. Rather than restart the article, retune() cancels and picks up
 *    from the last word boundary the engine reported.
 */

export type SpeechState = 'idle' | 'speaking' | 'paused' | 'unsupported';

/** Rough quality band, used to label and filter the picker. */
export type VoiceTier = 'high' | 'ok' | 'low';

export interface SpeechVoice {
  id: string;
  label: string;
  lang: string;
  tier: VoiceTier;
  /** Higher is better. Drives the default pick and the picker's order. */
  score: number;
}

/**
 * macOS and older iOS ship joke voices through the same API as real ones.
 * They are never a reasonable choice for reading an article, so they're pushed
 * far enough down that the picker drops them.
 */
const NOVELTY =
  /eloquence|novelty|whisper|bells|bubbles|organ|zarvox|trinoids|albert|bad news|good news|jester|bahh|boing|wobble|superstar|cellos|deranged|hysterical|junior|kathy|princess|ralph|fred|grandma|grandpa|rocko|sandy|shelley|flo\b|eddy|reed|bruce|agnes/;

/** Names that mark a genuinely higher-fidelity engine on some platform. */
const HIGH = /premium|enhanced|neural|natural|siri/;

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
  if (HIGH.test(name)) score += 40;
  if (/siri/.test(name)) score += 10;
  if (/google/.test(name)) score += 25;
  // iOS "Compact" voices are the low-bandwidth ones — actively avoid them.
  if (/compact/.test(name)) score -= 40;
  if (NOVELTY.test(name)) score -= 200;

  // Local voices don't stall waiting on a network round trip.
  if (v.localService) score += 10;
  if (v.default) score += 5;

  return score;
}

function tierOf(v: SpeechSynthesisVoice): VoiceTier {
  const name = v.name.toLowerCase();
  if (NOVELTY.test(name)) return 'low';
  if (HIGH.test(name)) return 'high';
  if (/compact/.test(name)) return 'low';
  // Google/Microsoft desktop voices are decent mid-tier engines.
  return 'ok';
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
/** Characters of queue[index] already spoken, per the engine's boundary events. */
let offset = 0;
let state: SpeechState = synth ? 'idle' : 'unsupported';
let token = 0; // invalidates in-flight utterances after a stop
let voiceCache: SpeechSynthesisVoice[] | null = null;
let onEndAll: (() => void) | null = null;
// Current settings live here so pause/resume/retune don't depend on the caller
// passing them back in identically every time.
let curVoice: string | null = null;
let curRate = 1;

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

/**
 * Back up to the start of the word containing `at`, so picking up again never
 * starts mid-word. Past the end means the chunk finished — replaying it would
 * repeat a sentence, so start it over from zero only if we never got a
 * boundary at all.
 */
function wordStart(text: string, at: number): number {
  if (at <= 0 || at >= text.length) return 0;
  const space = text.lastIndexOf(' ', at);
  return space > 0 ? space + 1 : 0;
}

function speakFrom(i: number, from = 0) {
  if (!synth || i >= queue.length) {
    if (i >= queue.length && queue.length > 0) {
      state = 'idle';
      index = 0;
      offset = 0;
      emit();
      onEndAll?.();
    }
    return;
  }
  const mine = token;
  index = i;
  offset = from;
  const u = new SpeechSynthesisUtterance(queue[i].slice(from));
  u.rate = curRate;
  // A hair above neutral. The dead-flat default pitch is a large part of why
  // stock TTS reads as robotic.
  u.pitch = 1.05;
  // No explicit choice means take the best one available rather than whatever
  // the platform happens to default to — often a low-bandwidth "Compact" voice.
  const wanted = curVoice ?? bestVoiceId();
  if (wanted && voiceCache) {
    const v = voiceCache.find((x) => x.voiceURI === wanted);
    if (v) {
      u.voice = v;
      // Match the utterance language to the voice, or the engine can layer a
      // mismatched accent on top of it.
      u.lang = v.lang;
    }
  }
  // charIndex is relative to what we handed the engine, so add the slice base.
  u.onboundary = (e) => {
    if (mine === token) offset = from + e.charIndex;
  };
  u.onend = () => {
    if (mine !== token) return; // cancelled — don't resurrect the queue
    speakFrom(i + 1, 0);
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
    return voiceCache.map(toVoice).sort((a, b) => b.score - a.score);
  },

  /** MUST be called synchronously from a user gesture on iOS. */
  speak(text: string, opts: { voiceId?: string | null; rate?: number; onEnd?: () => void } = {}) {
    if (!synth) return;
    token++;
    synth.cancel();
    if (opts.voiceId !== undefined) curVoice = opts.voiceId;
    if (opts.rate !== undefined) curRate = opts.rate;
    queue = splitForSpeech(text);
    onEndAll = opts.onEnd ?? null;
    speakFrom(0, 0);
  },

  /**
   * Change voice and/or speed without losing your place.
   *
   * An utterance already handed to the engine can't be retuned, so this cancels
   * and immediately re-speaks the remainder of the current chunk with the new
   * setting. Boundary events tell us where the engine actually got to, so the
   * seam lands at the last word instead of at the top of the article.
   */
  retune(opts: { voiceId?: string | null; rate?: number } = {}) {
    if (!synth) return;
    if (opts.voiceId !== undefined) curVoice = opts.voiceId;
    if (opts.rate !== undefined) curRate = opts.rate;
    // Idle or paused: the new setting simply applies on the next play/resume.
    if (state !== 'speaking') return;
    token++;
    synth.cancel();
    speakFrom(index, wordStart(queue[index] ?? '', offset));
  },

  /** Cancel and remember where we were — resume picks up at the same word. */
  pause() {
    if (!synth || state !== 'speaking') return;
    token++;
    synth.cancel();
    state = 'paused';
    emit();
  },

  resume(opts: { voiceId?: string | null; rate?: number } = {}) {
    if (!synth || state !== 'paused') return;
    if (opts.voiceId !== undefined) curVoice = opts.voiceId;
    if (opts.rate !== undefined) curRate = opts.rate;
    token++;
    speakFrom(index, wordStart(queue[index] ?? '', offset));
  },

  stop() {
    if (!synth) return;
    token++;
    synth.cancel();
    queue = [];
    index = 0;
    offset = 0;
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
  tier: tierOf(v),
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
