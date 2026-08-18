import { useEffect, useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { speech, type SpeechSnapshot } from '../../lib/speech';

const RATES = [0.9, 1, 1.25, 1.5];

/** Play/pause/stop for reading an article aloud. Hidden where unsupported. */
export function ReaderControls({ text, onFinished }: { text: string; onFinished?: () => void }) {
  const [snap, setSnap] = useState<SpeechSnapshot>(() => speech.getSnapshot());
  const [rate, setRate] = useState(1);

  useEffect(() => speech.subscribe(setSnap), []);
  // Leaving the article (or the screen) must stop the voice.
  useEffect(() => () => speech.stop(), []);

  if (!speech.supported()) return null;

  const playing = snap.state === 'speaking';
  const pct = snap.chunks > 0 ? Math.round(((snap.chunk + (playing ? 1 : 0)) / snap.chunks) * 100) : 0;

  return (
    <div className="flex items-center gap-2 rounded-btn bg-surface-2 border border-border p-1.5 mb-4">
      <button
        onClick={() => {
          haptics.tap();
          // iOS only starts speech inside the gesture — no awaits before this.
          if (playing) speech.pause();
          else if (snap.state === 'paused') speech.resume({ rate });
          else speech.speak(text, { rate, onEnd: onFinished });
        }}
        aria-label={playing ? 'Pause reading' : 'Read aloud'}
        className="w-9 h-9 rounded-btn bg-accent bg-accent-grad text-accent-fg grid place-items-center shrink-0"
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>

      {snap.state !== 'idle' && (
        <button
          onClick={() => {
            haptics.tap();
            speech.stop();
          }}
          aria-label="Stop reading"
          className="w-9 h-9 rounded-btn bg-surface text-fg-muted grid place-items-center shrink-0 border border-border"
        >
          <Square size={13} fill="currentColor" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-fg-muted mb-1">
          {snap.state === 'idle' ? 'Listen' : `${pct}%`}
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
              // Restart at the new speed so the change is audible immediately.
              if (playing) speech.speak(text, { rate: r, onEnd: onFinished });
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
  );
}
