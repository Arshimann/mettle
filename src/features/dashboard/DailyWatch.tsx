import { useMemo } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { Card, CardLabel } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { watchOfTheDay } from '../../data/watches';

/**
 * One hand-picked training video a day. Opens a YouTube search rather than a
 * hard video id — channels reorganise and links rot, but the topic doesn't.
 */
export function DailyWatch() {
  const watch = useMemo(() => watchOfTheDay(), []);
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(watch.query)}`;

  return (
    <Card className="p-0 overflow-hidden">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => haptics.tap()}
        className="block p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <CardLabel className="mb-0">Today's watch</CardLabel>
          <span className="text-[11px] text-fg-subtle">
            {watch.topic} · {watch.minutes} min
          </span>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-btn bg-accent bg-accent-grad text-accent-fg grid place-items-center shrink-0 glow-accent">
            <Play size={19} fill="currentColor" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold leading-snug truncate">{watch.title}</div>
            <div className="text-xs text-fg-muted mt-0.5 truncate">{watch.creator}</div>
          </div>
          <ExternalLink size={15} className="text-fg-subtle shrink-0" />
        </div>
        <p className="text-[13px] text-fg-muted leading-relaxed mt-2.5">{watch.why}</p>
      </a>
    </Card>
  );
}
