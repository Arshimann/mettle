import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronRight, Lock, Sparkles } from 'lucide-react';
import { Button, Card, CardLabel, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { PLAYBOOK, type PlaybookArticle, type PlaybookSection } from '../../data/playbook';
import { articleToSpeech, nextUpArticle, sectionProgress, totalRead } from '../../lib/playbook';
import { ReaderControls } from './ReaderControls';

/** Marks an article read on genuine engagement, not merely on opening it. */
function ArticleSheet({ article, onClose }: { article: PlaybookArticle; onClose: () => void }) {
  const markArticleRead = useStore((s) => s.markArticleRead);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  const finish = () => {
    if (done) return;
    setDone(true);
    markArticleRead(article.id);
  };

  // Dwelling long enough also counts — a short article may never scroll.
  useEffect(() => {
    const t = setTimeout(finish, 25_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.id]);

  const speech = useMemo(() => articleToSpeech(article), [article]);

  return (
    <Sheet open onClose={onClose} title={article.title}>
      <ReaderControls text={speech} onFinished={finish} />

      <div
        ref={bodyRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight * 0.9) finish();
        }}
        className="max-h-[52vh] overflow-y-auto -mx-1 px-1"
      >
        {article.blocks.map((b, i) =>
          b.kind === 'h' ? (
            <h3 key={i} className="text-[15px] font-bold mt-4 mb-1.5">
              {b.text}
            </h3>
          ) : b.kind === 'list' ? (
            <ul key={i} className="space-y-1.5 my-2.5">
              {b.items?.map((item, j) => (
                <li key={j} className="flex gap-2 text-[14px] leading-relaxed text-fg-muted">
                  <span className="text-accent mt-1.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p key={i} className="text-[14px] leading-relaxed text-fg-muted mb-2.5">
              {b.text}
            </p>
          ),
        )}

        <div className="rounded-card bg-surface-2 border border-border p-3.5 mt-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent mb-2">Key takeaways</div>
          <ul className="space-y-1.5">
            {article.takeaways.map((t) => (
              <li key={t} className="flex gap-2 text-[13px] leading-snug">
                <Check size={14} className="text-accent mt-0.5 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-fg-subtle mt-3 leading-snug">Source: {article.sources.join(' · ')}</p>
      </div>

      <Button variant="accent" size="lg" fullWidth className="mt-4" onClick={() => { finish(); onClose(); }}>
        {done ? 'Done' : 'Mark as read'}
      </Button>
    </Sheet>
  );
}

function SectionCard({ section, onOpen }: { section: PlaybookSection; onOpen: (a: PlaybookArticle) => void }) {
  const playbook = useStore((s) => s.playbook);
  const skipAhead = useStore((s) => s.skipAheadSection);
  const [expanded, setExpanded] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState<number | null>(null);

  const prog = sectionProgress(section, playbook);
  const Icon = section.icon;

  return (
    <Card className="mb-3">
      <button
        onClick={() => {
          haptics.tap();
          setExpanded((v) => !v);
        }}
        className="w-full flex items-center gap-3 text-left"
      >
        <div className="w-10 h-10 rounded-btn bg-accent-soft text-accent grid place-items-center shrink-0">
          <Icon size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{section.title}</div>
          <div className="text-xs text-fg-muted truncate">{section.tagline}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[13px] font-bold tabular">
            {prog.readCount}/{prog.totalCount}
          </div>
          <ChevronRight size={15} className={cn('text-fg-subtle ml-auto transition-transform', expanded && 'rotate-90')} />
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2.5">
          {section.levels.map((lvl) => {
            const lp = prog.levels.find((x) => x.level === lvl.level)!;
            return (
              <div key={lvl.level} className={cn('rounded-card border p-3', lp.locked ? 'border-border bg-surface-2/50' : 'border-border bg-surface-2')}>
                <div className="flex items-center gap-2 mb-1.5">
                  {lp.locked && <Lock size={13} className="text-fg-subtle shrink-0" />}
                  <span className="text-[13px] font-bold">
                    Level {lvl.level} · {lvl.title}
                  </span>
                  <span className="ml-auto text-[11px] text-fg-subtle tabular">
                    {lp.read}/{lp.total}
                  </span>
                </div>
                <div className="text-[12px] text-fg-muted mb-2">{lvl.blurb}</div>

                {lp.locked ? (
                  <button
                    onClick={() => {
                      if (confirmSkip === lvl.level) {
                        haptics.warn();
                        skipAhead(section.id, lvl.level);
                        setConfirmSkip(null);
                      } else {
                        setConfirmSkip(lvl.level);
                        setTimeout(() => setConfirmSkip((c) => (c === lvl.level ? null : c)), 3000);
                      }
                    }}
                    className="text-[12px] font-semibold text-accent"
                  >
                    {confirmSkip === lvl.level ? 'Tap again to unlock it' : 'Already know this? Skip ahead'}
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    {lvl.articles.map((a) => {
                      const read = Boolean(playbook.read[a.id]);
                      return (
                        <button
                          key={a.id}
                          onClick={() => {
                            haptics.tap();
                            onOpen(a);
                          }}
                          className="w-full flex items-center gap-2.5 text-left rounded-btn bg-surface px-2.5 py-2 border border-border"
                        >
                          <span
                            className={cn(
                              'w-5 h-5 rounded-full grid place-items-center shrink-0',
                              read ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-fg-subtle',
                            )}
                          >
                            {read ? <Check size={12} strokeWidth={3} /> : <BookOpen size={11} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-semibold truncate">{a.title}</span>
                            <span className="block text-[11px] text-fg-subtle truncate">{a.summary}</span>
                          </span>
                          <span className="text-[11px] text-fg-subtle shrink-0">{a.minutes}m</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/** Six sections, each a ladder of levels that opens as you read. */
export function Playbook() {
  const playbook = useStore((s) => s.playbook);
  const [open, setOpen] = useState<PlaybookArticle | null>(null);

  const next = useMemo(() => nextUpArticle(playbook), [playbook]);
  const { read, total } = totalRead(playbook);

  return (
    <div>
      <Card className="mb-3.5">
        <div className="flex items-baseline justify-between mb-2">
          <CardLabel className="mb-0">Your progress</CardLabel>
          <span className="text-[13px] font-bold tabular">
            {read}/{total}
          </span>
        </div>
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent bg-accent-grad transition-[width] duration-700"
            style={{ width: `${Math.round((read / total) * 100)}%` }}
          />
        </div>
        {next && (
          <button
            onClick={() => {
              haptics.tap();
              setOpen(next);
            }}
            className="w-full flex items-center gap-2.5 mt-3.5 rounded-btn bg-accent-soft border border-accent/30 p-3 text-left"
          >
            <Sparkles size={16} className="text-accent shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-accent">Up next</span>
              <span className="block text-[13px] font-semibold truncate mt-0.5">{next.title}</span>
            </span>
            <ChevronRight size={16} className="text-accent shrink-0" />
          </button>
        )}
      </Card>

      {PLAYBOOK.map((s) => (
        <SectionCard key={s.id} section={s} onOpen={setOpen} />
      ))}

      {open && <ArticleSheet article={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
