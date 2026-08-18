import { useMemo } from 'react';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { Card, CardLabel } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { useUI } from '../../store/useUI';
import { ALL_ARTICLES } from '../../data/playbook';
import { nextUpArticle } from '../../lib/playbook';

// Resolved once at module load, like the daily fact — same pick all day.
const TODAY_INDEX = Math.floor(Date.now() / 86400000) % ALL_ARTICLES.length;

/**
 * Surfaces one Playbook article on Home. Prefers the next unread one so the
 * card actually advances you through the ladder; falls back to a daily rotation
 * once everything is read.
 */
export function TodaysLesson() {
  const playbook = useStore((s) => s.playbook);
  const navigate = useUI((s) => s.navigate);

  const article = useMemo(() => nextUpArticle(playbook) ?? ALL_ARTICLES[TODAY_INDEX], [playbook]);

  const read = Boolean(playbook.read[article.id]);

  return (
    <Card className="p-0">
      <button
        onClick={() => {
          haptics.tap();
          navigate('learn');
        }}
        className="w-full text-left p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <CardLabel className="mb-0">{read ? 'From the playbook' : "Today's lesson"}</CardLabel>
          <span className="text-[11px] text-fg-subtle">{article.minutes} min read</span>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-btn bg-accent-soft text-accent grid place-items-center shrink-0">
            <GraduationCap size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold leading-snug truncate">{article.title}</div>
            <div className="text-xs text-fg-muted mt-0.5 truncate">{article.summary}</div>
          </div>
          <ChevronRight size={17} className="text-fg-subtle shrink-0" />
        </div>
      </button>
    </Card>
  );
}
