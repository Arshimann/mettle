import { useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play, Square } from 'lucide-react';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { speech, type SpeechSnapshot } from '../../lib/speech';
import { narrate, type NarrationFailure } from '../../lib/narration';

const RATES = [0.9, 1, 1.25, 1.5];

/**
 * Read-aloud controls. Prefers real ElevenLabs narration, and falls back to
 * the browser's built-in voice whenever that isn't available — no key, no
 * credits, or offline all end up on the same safe path rather than a dead
 * button.
 */
export function ReaderControls({ text, onFinished }: { text: string; onFinished?: () => void }) {
  const [snap, setSnap] = useState<SpeechSnapshot>(() => speech.getSnapshot());
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState<NarrationFailure | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPct, setAudioPct] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => speech.subscribe(setSnap), []);

  // Leaving the article must silence both engines.
  useEffect(
    () => () => {
      speech.stop();
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  if (!speech.supported() && typeof Audio === 'undefined') return null;

  const playing = audioPlaying || snap.state === 'speaking';
  const pct = hasAudio
    ? audioPct
    : snap.chunks > 0
      ? Math.round(((snap.chunk + (snap.state === 'speaking' ? 1 : 0)) / snap.chunks) * 100)
      : 0;

  const stopAll = () => {
    speech.stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioPlaying(false);
    setAudioPct(0);
    setHasAudio(false);
  };

  const startBrowserVoice = () => {
    // Must run inside the gesture — iOS refuses speech started after an await.
    speech.speak(text, { rate, onEnd: onFinished });
  };

  const start = async () => {
    setLoading(true);
    const { url, reason } = await narrate(text);
    setLoading(false);

    if (!url) {
      setUsingFallback(reason ?? 'failed');
      startBrowserVoice();
      return;
    }

    setUsingFallback(null);
    // Always a fresh element — reusing the ref's would mean mutating a value
    // read out of a ref, and a new one costs nothing.
    audioRef.current?.pause();
    const audio = new Audio(url);
    audio.playbackRate = rate;
    audio.ontimeupdate = () => {
      if (audio.duration) setAudioPct(Math.round((audio.currentTime / audio.duration) * 100));
    };
    audio.onended = () => {
      setAudioPlaying(false);
      setAudioPct(100);
      onFinished?.();
    };
    audio.onerror = () => {
      // A broken cached file shouldn't end the feature.
      setAudioPlaying(false);
      setUsingFallback('failed');
      startBrowserVoice();
    };
    audioRef.current = audio;
    try {
      await audio.play();
      setHasAudio(true);
      setAudioPlaying(true);
    } catch {
      // Autoplay refused (gesture too stale) — the built-in voice still works.
      setUsingFallback('failed');
      startBrowserVoice();
    }
  };

  const toggle = () => {
    haptics.tap();
    if (playing) {
      if (audioPlaying) {
        audioRef.current?.pause();
        setAudioPlaying(false);
      } else speech.pause();
      return;
    }
    if (audioRef.current && audioRef.current.currentTime > 0 && !audioRef.current.ended) {
      void audioRef.current.play().then(() => setAudioPlaying(true));
      return;
    }
    if (snap.state === 'paused') {
      speech.resume({ rate });
      return;
    }
    void start();
  };

  const note =
    usingFallback === 'unconfigured'
      ? 'Using the built-in voice — narration isn’t set up yet.'
      : usingFallback === 'quota'
        ? 'Using the built-in voice — narration is out of credits.'
        : usingFallback === 'offline'
          ? 'Using the built-in voice — you’re offline.'
          : usingFallback
            ? 'Using the built-in voice.'
            : null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 rounded-btn bg-surface-2 border border-border p-1.5">
        <button
          onClick={toggle}
          disabled={loading}
          aria-label={playing ? 'Pause reading' : 'Read aloud'}
          className="w-9 h-9 rounded-btn bg-accent bg-accent-grad text-accent-fg grid place-items-center shrink-0 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : playing ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" />
          )}
        </button>

        {(playing || snap.state === 'paused' || hasAudio) && (
          <button
            onClick={() => {
              haptics.tap();
              stopAll();
            }}
            aria-label="Stop reading"
            className="w-9 h-9 rounded-btn bg-surface text-fg-muted grid place-items-center shrink-0 border border-border"
          >
            <Square size={13} fill="currentColor" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-fg-muted mb-1">
            {loading ? 'Preparing…' : playing || pct > 0 ? `${pct}%` : 'Listen'}
          </div>
          <div className="h-1 rounded-full bg-surface overflow-hidden">
            <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex gap-0.5 shrink-0">
          {RATES.map((r) => (
            <button
              key={r}
              onClick={() => {
                haptics.select();
                setRate(r);
                // The browser voice can't retune mid-utterance; restart it.
                if (!audioPlaying && snap.state === 'speaking') speech.speak(text, { rate: r, onEnd: onFinished });
              }}
              className={cn(
                'px-1.5 h-7 rounded-md text-[11px] font-bold tabular',
                rate === r ? 'bg-accent text-accent-fg' : 'text-fg-subtle',
              )}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>
      {note && <p className="text-[10.5px] text-fg-subtle mt-1.5 px-0.5">{note}</p>}
    </div>
  );
}
