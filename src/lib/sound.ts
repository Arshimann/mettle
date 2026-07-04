/**
 * Chime via the Web Audio API, shared by the rest timer and the stretch
 * routine player.
 *
 * iOS (and some Android browsers) only allow an AudioContext to start from a
 * user gesture — our chimes fire from timer callbacks, so a per-call context
 * stays "suspended" and is silent. Fix: one shared context, unlocked on the
 * first touch/click anywhere, reused and resume()d for every chime.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const Ctx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctx();
  } catch {
    ctx = null; // audio unavailable
  }
  return ctx;
}

/** Install a one-time listener that unlocks audio on the first user gesture.
 *  Call once at boot (main.tsx). */
export function initAudio(): void {
  const unlock = () => {
    const c = getCtx();
    if (c && c.state === 'suspended') void c.resume().catch(() => {});
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('touchend', unlock);
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('touchend', unlock, { passive: true });
}

// ---- UI sound-effects palette -------------------------------------------
// All synthesized on the shared context; every effect is short (<0.5s), quiet,
// and gated by the global "Sound effects" setting (kept in sync from main.tsx,
// like haptics). The rest-timer chime below keeps its own separate toggle.

let fxEnabled = true;

export function setSoundFxEnabled(v: boolean): void {
  fxEnabled = v;
}

const lastPlayed = new Map<string, number>();

/** One synth note. */
function note(
  freq: number,
  at: number,
  dur: number,
  peak: number,
  type: OscillatorType = 'sine',
) {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume().catch(() => {});
  const o = c.createOscillator();
  const g = c.createGain();
  o.connect(g);
  g.connect(c.destination);
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + at;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.02);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
  };
}

/** Debounced, toggle-gated entry point for every effect. */
function fx(name: string, play: () => void, gapMs = 140) {
  if (!fxEnabled) return;
  const now = Date.now();
  if (now - (lastPlayed.get(name) ?? 0) < gapMs) return;
  lastPlayed.set(name, now);
  try {
    play();
  } catch {
    /* audio unavailable */
  }
}

/** Soft UI blip — settings cog, segmented switches. */
export const sfxTick = () => fx('tick', () => note(1250, 0, 0.05, 0.05, 'triangle'));

/** Satisfying check-off pop — supplements. */
export const sfxPop = () =>
  fx('pop', () => {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') void c.resume().catch(() => {});
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.type = 'sine';
    const t = c.currentTime;
    o.frequency.setValueAtTime(900, t);
    o.frequency.exponentialRampToValueAtTime(420, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.start(t);
    o.stop(t + 0.13);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  });

/** Two rising notes when a set is ticked done. */
export const sfxSetDone = () =>
  fx('setDone', () => {
    note(660, 0, 0.09, 0.1);
    note(990, 0.07, 0.12, 0.1);
  });

/** Short ascending arpeggio for finishing a workout. */
export const sfxFanfare = () =>
  fx(
    'fanfare',
    () => {
      [523, 659, 784, 1046].forEach((f, i) => note(f, i * 0.09, 0.22, 0.13));
    },
    600,
  );

/** High glittery blips layered under the fireworks. */
export const sfxSparkle = () =>
  fx(
    'sparkle',
    () => {
      [1567, 2093, 1760, 2349, 1976].forEach((f, i) => note(f, 0.15 + i * 0.11, 0.1, 0.05, 'triangle'));
    },
    600,
  );

export function playChime(freq = 880) {
  try {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'suspended') void c.resume().catch(() => {});
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.32);
    o.start();
    o.stop(c.currentTime + 0.34);
    // Keep the context alive for reuse; just disconnect the nodes when done.
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  } catch {
    /* audio unavailable */
  }
}
