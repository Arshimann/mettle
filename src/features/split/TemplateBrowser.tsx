import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Sheet } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { TEMPLATES, TEMPLATE_CATEGORIES, type Template } from '../../data/templates';

/** Browse starter splits grouped by category; preview days, then apply.
 *  Applying replaces the current split, so a non-empty split gets a warning. */
export function TemplateBrowser({ open, onClose }: { open: boolean; onClose: () => void }) {
  const split = useStore((s) => s.split);
  const applyTemplate = useStore((s) => s.applyTemplate);
  const [selected, setSelected] = useState<Template | null>(null);

  const apply = (t: Template) => {
    applyTemplate(t.days);
    haptics.success();
    setSelected(null);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={() => { setSelected(null); onClose(); }}
      title={selected ? selected.name : 'Starter splits'}
    >
      {!selected ? (
        <div className="space-y-4">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const list = TEMPLATES.filter((t) => t.category === cat);
            if (list.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle mb-2 px-0.5">
                  {cat}
                </div>
                <div className="space-y-2">
                  {list.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { haptics.tap(); setSelected(t); }}
                      className="w-full text-left rounded-card bg-surface-2 p-3.5 flex items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold">{t.name}</span>
                          <span className="text-[11px] text-fg-subtle shrink-0">{t.cadence}</span>
                        </div>
                        <div className="text-xs text-fg-muted mt-0.5">{t.desc}</div>
                      </div>
                      <ChevronRight size={16} className="text-fg-subtle shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <button
            onClick={() => { haptics.tap(); setSelected(null); }}
            className="flex items-center gap-1 text-[13px] font-semibold text-fg-muted mb-3 -mt-1"
          >
            <ChevronLeft size={15} /> All splits
          </button>
          <p className="text-sm text-fg-muted mb-4">{selected.desc}</p>
          <div className="space-y-3 mb-5">
            {selected.days.map((d) => (
              <div key={d.name} className="bg-surface-2 rounded-card p-3.5">
                <div className="font-semibold mb-1.5">{d.name}</div>
                <div className="text-sm text-fg-muted leading-relaxed">
                  {d.exercises.map((x) => `${x.name} ${x.targetSets}×${x.targetReps}`).join(' · ')}
                </div>
              </div>
            ))}
          </div>
          {split.length > 0 && (
            <p className="text-xs text-fg-muted mb-2.5 text-center">
              This replaces your current split ({split.length} day{split.length === 1 ? '' : 's'}).
            </p>
          )}
          <Button variant="accent" size="lg" fullWidth onClick={() => apply(selected)}>
            Use this split
          </Button>
        </div>
      )}
    </Sheet>
  );
}
