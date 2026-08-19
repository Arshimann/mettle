import { useEffect, useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { speech, type SpeechSnapshot, type SpeechVoice } from '../../lib/speech';
import { useStore } from '../../store/useStore';

const RATES = [0.9, 1, 1.15, 1.3];

/**
 * Read-aloud controls for an article.
 *
 * The voice list is ranked by quality, and the chosen one is remembered — most
 * devices ship a far better voice than the one they default to, they just
 * never pick it for you.
 */
export function ReaderControls({ text, onFinished }: { text: string; onFinished?: () => void }) {
  const savedVoice = useStore((s) => s.settings.speechVoiceId);
  const savedRate = useStore((s) => s.settings.speechRate);
  const updateSettings = useStore((s) => s.updateSettings);

  const [snap, setSnap] = useState<SpeechSnapshot>(() => speech.getSnapshot());
  const [voices, setVoices] = useState<SpeechVoice[]>([]);

  useEffect(() => speech.subscribe(setSnap), []);
  // Leaving the article must silence the reader.
  useEffect(() => () => speech.stop(), []);

  // Load the voice list up front so `speak()` can stay synchronous — iOS
  // refuses speech that starts after an await inside the gesture.
  useEffect(() => {
    void speech.listVoices().then(setVoices);
  }, []);

  if (!speech.supported()) return null;

  const rate = savedRate || 1;
  const playing = snap.state === 'speaking';
  const pct = snap.chunks > 0 ? Math.round(((snap.chunk + (playing ? 1 : 0)) / snap.chunks) * 100) : 0;
  // Only worth showing a picker when there's a real choice to make.
  const pickable = voices.slice(0, 8);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 rounded-btn bg-surface-2 border border-border p-1.5">
        <button
          onClick={() => {
            haptics.tap();
            if (playing) speech.pause();
            else if (snap.state === 'paused') speech.resume({ voiceId: savedVoice, rate });
            else speech.speak(text, { voiceId: savedVoice, rate, onEnd: onFinished });
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
                updateSettings({ speechRate: r });
                // The engine can't retune mid-utterance — restart at the new speed.
                if (playing) speech.speak(text, { voiceId: savedVoice, rate: r, onEnd: onFinished });
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

      {pickable.length > 1 && (
        <div className="flex items-center gap-2 mt-2 px-0.5">
          <span className="text-[11px] text-fg-subtle shrink-0">Voice</span>
          <select
            value={savedVoice ?? pickable[0]?.id ?? ''}
            onChange={(e) => {
              updateSettings({ speechVoiceId: e.target.value });
              speech.stop();
            }}
            aria-label="Reading voice"
            className="min-w-0 flex-1 h-8 px-2 rounded-btn bg-surface-2 border border-border text-[12px] text-fg-muted outline-none"
          >
            {pickable.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
