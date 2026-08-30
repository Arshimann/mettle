import { useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Layers, Plus, Trash2 } from 'lucide-react';
import { Button, Segmented, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { prettyDate } from '../../lib/date';
import { useStore } from '../../store/useStore';
import { TEMPLATES, TEMPLATE_CATEGORIES, type Template } from '../../data/templates';
import { DAY_TEMPLATES, type DayTemplate } from '../../data/dayTemplates';
import type { ApplyMode } from '../../types';

type Tab = 'splits' | 'days' | 'saved';

/** How a chosen split lands. Only offered when there's a split to protect. */
function ModeChoice({ mode, onChange, dayCount }: { mode: ApplyMode; onChange: (m: ApplyMode) => void; dayCount: number }) {
  return (
    <div className="mb-3.5">
      <Segmented
        fullWidth
        value={mode}
        onChange={onChange}
        options={[
          { value: 'append' as ApplyMode, label: 'Add days' },
          { value: 'replace' as ApplyMode, label: 'Replace' },
        ]}
      />
      <p className="text-xs text-fg-muted mt-2 text-center leading-snug">
        {mode === 'append'
          ? `Keeps your ${dayCount} day${dayCount === 1 ? '' : 's'} and adds these after them.`
          : `Deletes your current ${dayCount} day${dayCount === 1 ? '' : 's'} and starts fresh.`}
      </p>
    </div>
  );
}

/**
 * Browse starter splits, drop in a single day, or reload a preset you saved.
 * Applying no longer silently destroys your split — with days already there,
 * you choose Add or Replace.
 */
export function TemplateBrowser({ open, onClose }: { open: boolean; onClose: () => void }) {
  const split = useStore((s) => s.split);
  const savedSplits = useStore((s) => s.savedSplits);
  const applyTemplate = useStore((s) => s.applyTemplate);
  const applySavedSplit = useStore((s) => s.applySavedSplit);
  const deleteSavedSplit = useStore((s) => s.deleteSavedSplit);
  const savedDays = useStore((s) => s.savedDays);
  const addSavedDay = useStore((s) => s.addSavedDay);
  const deleteSavedDay = useStore((s) => s.deleteSavedDay);
  const addDay = useStore((s) => s.addDay);

  const [tab, setTab] = useState<Tab>('splits');
  const [selected, setSelected] = useState<Template | null>(null);
  // Default to the non-destructive option whenever there's something to lose.
  const [mode, setMode] = useState<ApplyMode>('append');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const hasSplit = split.length > 0;
  const close = () => {
    setSelected(null);
    setConfirmDelete(null);
    onClose();
  };

  const applySplit = (t: Template) => {
    applyTemplate(t.days, hasSplit ? mode : 'replace');
    haptics.success();
    close();
  };

  const applyPreset = (id: string) => {
    applySavedSplit(id, hasSplit ? mode : 'replace');
    haptics.success();
    close();
  };

  const addOneDay = (d: DayTemplate) => {
    addDay(d.name, d.exercises);
    haptics.success();
    close();
  };

  return (
    <Sheet open={open} onClose={close} title={selected ? selected.name : 'Add to your split'}>
      {selected ? (
        <div>
          <button
            onClick={() => {
              haptics.tap();
              setSelected(null);
            }}
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
          {hasSplit && <ModeChoice mode={mode} onChange={setMode} dayCount={split.length} />}
          <Button variant="accent" size="lg" fullWidth onClick={() => applySplit(selected)}>
            {!hasSplit ? 'Use this split' : mode === 'append' ? 'Add these days' : 'Replace my split'}
          </Button>
        </div>
      ) : (
        <div>
          <Segmented
            fullWidth
            value={tab}
            onChange={setTab}
            options={[
              { value: 'splits' as Tab, label: 'Splits' },
              { value: 'days' as Tab, label: 'Single day' },
              {
                value: 'saved' as Tab,
                label: `Saved${savedSplits.length + savedDays.length ? ` (${savedSplits.length + savedDays.length})` : ''}`,
              },
            ]}
          />

          <div className="mt-4">
            {tab === 'splits' && (
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
                            onClick={() => {
                              haptics.tap();
                              setSelected(t);
                            }}
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
            )}

            {tab === 'days' && (
              <div className="space-y-2">
                <p className="text-xs text-fg-muted mb-3 px-0.5 leading-snug">
                  Drops one ready-made day into your split — everything else stays put.
                </p>
                {DAY_TEMPLATES.map((d) => (
                  <div key={d.id} className="rounded-card bg-surface-2 p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-btn bg-accent-soft text-accent grid place-items-center shrink-0">
                      <Layers size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-xs text-fg-muted mt-0.5 truncate">
                        {d.focus} · {d.exercises.length} exercises
                      </div>
                    </div>
                    <Button size="sm" variant="accent" onClick={() => addOneDay(d)}>
                      <Plus size={14} /> Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'saved' && (
              <div>
                {savedDays.length > 0 && (
                  <div className="mb-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle mb-2 px-0.5">
                      Saved days
                    </div>
                    <div className="space-y-2">
                      {savedDays.map((d) => (
                        <div key={d.id} className="rounded-card bg-surface-2 p-3.5 flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate">{d.name}</div>
                            <div className="text-xs text-fg-muted mt-0.5">
                              {d.exercises.length} exercise{d.exercises.length === 1 ? '' : 's'} · saved{' '}
                              {prettyDate(d.savedAt.slice(0, 10))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => {
                              haptics.success();
                              addSavedDay(d.id);
                              onClose();
                            }}
                            aria-label={`Add ${d.name} to your split`}
                          >
                            <Plus size={15} /> Add
                          </Button>
                          <button
                            onClick={() => {
                              if (confirmDelete === d.id) {
                                deleteSavedDay(d.id);
                                haptics.warn();
                                setConfirmDelete(null);
                              } else {
                                setConfirmDelete(d.id);
                                setTimeout(() => setConfirmDelete((c) => (c === d.id ? null : c)), 3000);
                              }
                            }}
                            aria-label={`Delete saved day ${d.name}`}
                            className={cn(
                              'w-8 h-8 grid place-items-center shrink-0',
                              confirmDelete === d.id ? 'text-danger' : 'text-fg-subtle',
                            )}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {savedSplits.length === 0 && savedDays.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-11 h-11 rounded-card bg-surface-2 grid place-items-center text-fg-subtle mx-auto mb-3">
                      <Bookmark size={20} />
                    </div>
                    <p className="text-sm text-fg-muted leading-relaxed max-w-[16rem] mx-auto">
                      Nothing saved yet. Bookmark a single day, or tap{' '}
                      <span className="font-semibold text-fg">Save</span> on the Split screen to keep the whole
                      split here.
                    </p>
                  </div>
                ) : savedSplits.length === 0 ? null : (
                  <>
                    <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle mb-2 px-0.5">
                      Saved splits
                    </div>
                    {hasSplit && <ModeChoice mode={mode} onChange={setMode} dayCount={split.length} />}
                    <div className="space-y-2">
                      {savedSplits.map((p) => (
                        <div key={p.id} className="rounded-card bg-surface-2 p-3.5 flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold truncate">{p.name}</div>
                            <div className="text-xs text-fg-muted mt-0.5">
                              {p.days.length} day{p.days.length === 1 ? '' : 's'} · saved {prettyDate(p.savedAt.slice(0, 10))}
                            </div>
                          </div>
                          <Button size="sm" variant="accent" onClick={() => applyPreset(p.id)}>
                            Load
                          </Button>
                          <button
                            onClick={() => {
                              if (confirmDelete === p.id) {
                                deleteSavedSplit(p.id);
                                haptics.warn();
                                setConfirmDelete(null);
                              } else {
                                setConfirmDelete(p.id);
                                setTimeout(() => setConfirmDelete((c) => (c === p.id ? null : c)), 3000);
                              }
                            }}
                            aria-label={`Delete preset ${p.name}`}
                            className={cn(
                              'w-8 h-8 grid place-items-center shrink-0',
                              confirmDelete === p.id ? 'text-danger' : 'text-fg-subtle',
                            )}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {confirmDelete && (
                      <p className="text-xs text-danger mt-2 text-center">Tap the bin again to delete that preset.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
