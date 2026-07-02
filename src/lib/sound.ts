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
