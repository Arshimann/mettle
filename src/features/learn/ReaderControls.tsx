import { useEffect, useState } from 'react';
import { HelpCircle, Pause, Play, Square } from 'lucide-react';
import { Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { isAndroid, isIOS } from '../../lib/platform';
import { speech, type SpeechSnapshot, type SpeechVoice } from '../../lib/speech';
import { useStore } from '../../store/useStore';

const RATES = [0.9, 1, 1.15, 1.3];

type Guide = { id: 'ios' | 'mac' | 'android' | 'windows'; label: string; steps: string[]; picks: string };

/**
 * Where the good voices actually come from. A web app can only speak with
 * voices installed on the device — there is no way to ship one inside the app —
 * but every platform has far better ones available for free, one download away
 * and switched off by default. These are those downloads.
 */
const GUIDES: Guide[] = [
  {
    id: 'ios',
    label: 'iPhone / iPad',
    steps: [
      'Settings → Accessibility → Spoken Content → Voices → English',
      'Tap a voice, then the download arrow next to a Premium or Enhanced entry',
      'Fully close Mettle (swipe it away) and reopen it, then pick the new voice above',
    ],
    picks: 'Best: Ava (Premium), Zoe (Premium), Evan (Enhanced), Serena (Premium). Anything marked “Compact” is the robotic one.',
  },
  {
    id: 'android',
    label: 'Android',
    steps: [
      'Settings → System → Languages & input → Text-to-speech output',
      'Choose Speech Services by Google, open its settings → Install voice data → English',
      'Download a voice, set it as preferred, then reopen Mettle',
    ],
    picks: 'Google’s network voices are the good ones — the offline fallback is the flat, clipped one.',
  },
  {
    id: 'mac',
    label: 'Mac',
    steps: [
      'System Settings → Accessibility → Spoken Content → System Voice → Manage Voices…',
      'Download an English voice marked Premium or Enhanced',
      'Reload Mettle, then pick it above',
    ],
    picks: 'Best: Ava (Premium), Allison (Premium), Tom (Enhanced), Zoe (Premium).',
  },
  {
    id: 'windows',
    label: 'Windows',
    steps: [
      'Settings → Time & language → Speech → Manage voices → Add voices',
      'Install an English voice, then restart the browser',
      'Or open Mettle in Microsoft Edge, which exposes free “Natural” neural voices no other browser gets',
    ],
    picks: 'Best: any voice ending in “Natural” (Ava, Andrew, Emma) in Edge. David and Zira are the old robotic pair.',
  },
];

const defaultGuide = (): Guide['id'] => (isIOS() ? 'ios' : isAndroid() ? 'android' : navigator.platform?.startsWith('Mac') ? 'mac' : 'windows');

/**
 * Read-aloud controls for an article.
 *
 * The voice list is ranked by quality and the choice is remembered — most
 * devices ship a far better voice than the one they default to, they just
 * never pick it for you. Changing voice or speed mid-article keeps your place.
 */
export function ReaderControls({ text, onFinished }: { text: string; onFinished?: () => void }) {
  const savedVoice = useStore((s) => s.settings.speechVoiceId);
  const savedRate = useStore((s) => s.settings.speechRate);
  const updateSettings = useStore((s) => s.updateSettings);

  const [snap, setSnap] = useState<SpeechSnapshot>(() => speech.getSnapshot());
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [guide, setGuide] = useState<Guide['id']>(defaultGuide);

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

  // Only offer voices worth listening to: novelty and low-bandwidth voices are
  // dropped outright rather than buried, unless that would leave nothing.
  const good = voices.filter((v) => v.tier !== 'low' && v.score > 0);
  const pickable = (good.length ? good : voices).slice(0, 10);
  const active = pickable.find((v) => v.id === savedVoice) ?? pickable[0];
  const hasHighTier = pickable.some((v) => v.tier === 'high');
  const g = GUIDES.find((x) => x.id === guide) ?? GUIDES[0];

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
                // Keeps your place — see speech.retune().
                speech.retune({ rate: r });
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

      {pickable.length > 0 && (
        <div className="flex items-center gap-2 mt-2 px-0.5">
          <span className="text-[11px] text-fg-subtle shrink-0">Voice</span>
          <select
            value={active?.id ?? ''}
            onChange={(e) => {
              updateSettings({ speechVoiceId: e.target.value });
              speech.retune({ voiceId: e.target.value });
            }}
            aria-label="Reading voice"
            className="min-w-0 flex-1 h-8 px-2 rounded-btn bg-surface-2 border border-border text-[12px] text-fg-muted outline-none"
          >
            {pickable.map((v) => (
              <option key={v.id} value={v.id}>
                {v.tier === 'high' ? `★ ${v.label}` : v.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              haptics.tap();
              setHelpOpen(true);
            }}
            aria-label="How to get better voices"
            className={cn(
              'h-8 px-2 rounded-btn border text-[11px] font-semibold shrink-0 inline-flex items-center gap-1',
              // If nothing high-tier is installed, this is the fix — say so.
              hasHighTier ? 'bg-surface-2 border-border text-fg-subtle' : 'bg-accent/10 border-accent/40 text-accent',
            )}
          >
            <HelpCircle size={13} />
            {hasHighTier ? '' : 'Better voices'}
          </button>
        </div>
      )}

      <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="Better voices">
        <p className="text-sm text-fg-muted leading-relaxed -mt-1">
          Mettle reads with the voices installed on your device — an app can’t bring its own. Every
          platform hides much better ones behind a free download, and never turns them on for you.
          It takes about a minute.
        </p>

        <div className="flex gap-1.5 mt-4 mb-3 overflow-x-auto">
          {GUIDES.map((x) => (
            <button
              key={x.id}
              onClick={() => setGuide(x.id)}
              className={cn(
                'h-8 px-3 rounded-btn text-[12px] font-semibold shrink-0 border transition-colors',
                guide === x.id
                  ? 'bg-accent border-accent text-accent-fg'
                  : 'bg-surface-2 border-border text-fg-muted',
              )}
            >
              {x.label}
            </button>
          ))}
        </div>

        <ol className="space-y-2.5">
          {g.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-surface-2 border border-border grid place-items-center text-[11px] font-bold shrink-0">
                {i + 1}
              </span>
              <span className="text-fg-muted">{s}</span>
            </li>
          ))}
        </ol>

        <p className="text-[12px] text-fg-subtle leading-relaxed mt-4 p-3 rounded-btn bg-surface-2 border border-border">
          {g.picks}
        </p>
        <p className="text-[11px] text-fg-subtle leading-relaxed mt-2">
          Voices marked ★ in the list above are the high-quality ones your device already has.
        </p>
      </Sheet>
    </div>
  );
}
