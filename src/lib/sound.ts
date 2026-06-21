/** Short sine-wave chime via the Web Audio API. Used by the rest timer and the
 *  stretch routine player. Silently no-ops if audio is unavailable. */
export function playChime(freq = 880) {
  try {
    const Ctx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
    o.start();
    o.stop(ctx.currentTime + 0.34);
    setTimeout(() => ctx.close(), 500);
  } catch {
    /* audio unavailable */
  }
}
