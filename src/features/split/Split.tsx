import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Bookmark, Dumbbell, GripVertical, LayoutGrid, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button, Card, EmptyState, PageHeader, Sheet, Sortable, Stepper } from '../../components/ui';
import { ExercisePicker } from '../../components/ExercisePicker';
import { TemplateBrowser } from './TemplateBrowser';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';

const exId = (dayId: string, name: string) => `${dayId}::${name}`;

export function Split() {
  const split = useStore((s) => s.split);
  const addDay = useStore((s) => s.addDay);
  const updateDay = useStore((s) => s.updateDay);
  const removeDay = useStore((s) => s.removeDay);
  const setDays = useStore((s) => s.setDays);
  const savedSplits = useStore((s) => s.savedSplits);

  const saveCurrentSplit = useStore((s) => s.saveCurrentSplit);

  const [pickerForDay, setPickerForDay] = useState<string | null>(null);
  const [nameSheet, setNameSheet] = useState<{ id: string | null; value: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [presetName, setPresetName] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [targetSheet, setTargetSheet] = useState<{ dayId: string; idx: number; name: string; sets: string; reps: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const dayOf = (id: string) => split.find((d) => d.id === id);
  const pickerDay = pickerForDay ? dayOf(pickerForDay) : null;

  const onDaysDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = split.findIndex((d) => d.id === active.id);
    const to = split.findIndex((d) => d.id === over.id);
    if (from < 0 || to < 0) return;
    haptics.tap();
    setDays(arrayMove(split, from, to));
  };

  const onExDragEnd = (dayId: string) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const day = dayOf(dayId);
    if (!day) return;
    const ids = day.exercises.map((x) => exId(dayId, x.name));
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    haptics.tap();
    updateDay(dayId, { exercises: arrayMove(day.exercises, from, to) });
  };

  const saveName = () => {
    if (!nameSheet) return;
    const v = nameSheet.value.trim() || 'New Day';
    if (nameSheet.id) updateDay(nameSheet.id, { name: v });
    else addDay(v);
    haptics.success();
    setNameSheet(null);
  };

  const addExerciseToDay = (name: string) => {
    if (!pickerForDay) return;
    const day = dayOf(pickerForDay);
    if (!day || day.exercises.some((e) => e.name.toLowerCase() === name.toLowerCase())) return;
    // Stamp the user's default target so Train pre-builds sets; editable per row.
    const { defaultTargetSets, defaultTargetReps } = useStore.getState().settings;
    updateDay(pickerForDay, {
      exercises: [
        ...day.exercises,
        {
          name,
          targetSets: defaultTargetSets > 0 ? defaultTargetSets : undefined,
          targetReps: defaultTargetReps.trim() || undefined,
        },
      ],
    });
  };

  const savePreset = () => {
    const name = (presetName ?? '').trim();
    if (!name) return;
    saveCurrentSplit(name);
    haptics.success();
    setPresetName(null);
    setToast(`Saved “${name}”`);
    setTimeout(() => setToast(null), 2400);
  };

  const removeExercise = (dayId: string, idx: number) => {
    const day = dayOf(dayId);
    if (!day) return;
    updateDay(dayId, { exercises: day.exercises.filter((_, i) => i !== idx) });
    haptics.tap();
  };

  return (
    <div>
      <PageHeader
        title="Split"
        subtitle={split.length ? `${split.length} day${split.length === 1 ? '' : 's'}` : 'Your training days'}
        action={
          <div className="flex items-center gap-2">
            {split.length > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  haptics.tap();
                  setPresetName(`My split ${savedSplits.length + 1}`);
                }}
                aria-label="Save split as preset"
              >
                <Bookmark size={15} /> Save
              </Button>
            )}
            <Button size="sm" onClick={() => { haptics.tap(); setTemplatesOpen(true); }}>
              <LayoutGrid size={15} /> Templates
            </Button>
            <Button size="sm" variant="accent" onClick={() => { haptics.tap(); setNameSheet({ id: null, value: '' }); }}>
              <Plus size={15} /> Day
            </Button>
          </div>
        }
      />

      <TemplateBrowser open={templatesOpen} onClose={() => setTemplatesOpen(false)} />

      {split.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={Dumbbell}
            title="Build your split"
            body="Add a training day, then fill it with exercises."
            action={<Button variant="accent" onClick={() => setNameSheet({ id: null, value: '' })}>Add a day</Button>}
          />
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDaysDragEnd}>
          <SortableContext items={split.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {split.map((day) => (
                <Sortable key={day.id} id={day.id}>
                  {({ handle }) => (
                    <Card>
                      <div className="flex items-center gap-1 mb-3">
                        <button
                          {...handle}
                          className="w-6 h-8 grid place-items-center text-fg-subtle cursor-grab active:cursor-grabbing -ml-1"
                          aria-label="Reorder day"
                        >
                          <GripVertical size={17} />
                        </button>
                        <h3 className="text-lg flex-1 truncate">{day.name}</h3>
                        <button
                          onClick={() => { haptics.tap(); setNameSheet({ id: day.id, value: day.name }); }}
                          className="w-8 h-8 grid place-items-center text-fg-subtle"
                          aria-label="Rename day"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirmDelete === day.id) {
                              removeDay(day.id);
                              haptics.warn();
                              setConfirmDelete(null);
                            } else {
                              setConfirmDelete(day.id);
                              setTimeout(() => setConfirmDelete((c) => (c === day.id ? null : c)), 3000);
                            }
                          }}
                          className={cn('w-8 h-8 grid place-items-center', confirmDelete === day.id ? 'text-danger' : 'text-fg-subtle')}
                          aria-label="Delete day"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      {confirmDelete === day.id && (
                        <div className="text-xs text-danger mb-2 -mt-1.5">Tap delete again to remove this day.</div>
                      )}

                      {day.exercises.length === 0 ? (
                        <div className="text-sm text-fg-muted py-1.5 mb-3">No exercises yet.</div>
                      ) : (
                        <div className="mb-3">
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onExDragEnd(day.id)}>
                            <SortableContext
                              items={day.exercises.map((x) => exId(day.id, x.name))}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-1.5">
                                {day.exercises.map((ex, idx) => (
                                  <Sortable key={exId(day.id, ex.name)} id={exId(day.id, ex.name)}>
                                    {({ handle }) => (
                                      <div className="flex items-center gap-1.5 bg-surface-2 rounded-btn pl-1 pr-1.5 h-11">
                                        <button
                                          {...handle}
                                          className="w-6 h-9 grid place-items-center text-fg-subtle cursor-grab active:cursor-grabbing"
                                          aria-label="Reorder exercise"
                                        >
                                          <GripVertical size={16} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            haptics.tap();
                                            setTargetSheet({
                                              dayId: day.id,
                                              idx,
                                              name: ex.name,
                                              sets: ex.targetSets ? String(ex.targetSets) : '',
                                              reps: ex.targetReps ?? '',
                                            });
                                          }}
                                          className="flex-1 min-w-0 flex items-center gap-2 text-left"
                                        >
                                          <span className="min-w-0 truncate text-[15px] font-medium">{ex.name}</span>
                                          <span
                                            className={cn(
                                              'text-[12px] shrink-0 px-1.5 py-0.5 rounded-md',
                                              ex.targetSets ? 'text-fg-subtle bg-canvas/60' : 'text-fg-subtle/60',
                                            )}
                                          >
                                            {ex.targetSets ? `${ex.targetSets}×${ex.targetReps || '?'}` : 'sets×reps'}
                                          </span>
                                        </button>
                                        <button
                                          onClick={() => removeExercise(day.id, idx)}
                                          className="w-7 h-7 grid place-items-center text-fg-subtle shrink-0"
                                          aria-label={`Remove ${ex.name}`}
                                        >
                                          <X size={15} />
                                        </button>
                                      </div>
                                    )}
                                  </Sortable>
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </div>
                      )}

                      <Button variant="outline" fullWidth size="sm" onClick={() => { haptics.tap(); setPickerForDay(day.id); }}>
                        <Plus size={15} /> Add exercise
                      </Button>
                    </Card>
                  )}
                </Sortable>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ExercisePicker
        open={!!pickerForDay}
        onClose={() => setPickerForDay(null)}
        onPick={addExerciseToDay}
        exclude={pickerDay?.exercises.map((e) => e.name) ?? []}
      />

      {/* Per-exercise target editor: sets × reps used to pre-build the logger. */}
      <Sheet open={!!targetSheet} onClose={() => setTargetSheet(null)} title={targetSheet?.name}>
        {targetSheet && (
          <div className="space-y-3">
            <div>
              <div className="text-[13px] font-semibold text-fg-muted mb-1.5">Target sets</div>
              <Stepper
                value={targetSheet.sets}
                onChange={(v) => setTargetSheet({ ...targetSheet, sets: v })}
                step={1}
                min={1}
                placeholder="3"
                aria-label="Target sets"
              />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-fg-muted mb-1.5">Target reps</div>
              <input
                value={targetSheet.reps}
                onChange={(e) => setTargetSheet({ ...targetSheet, reps: e.target.value })}
                placeholder="8–12"
                className="w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong"
              />
            </div>
            <Button
              variant="accent"
              size="lg"
              fullWidth
              onClick={() => {
                const day = dayOf(targetSheet.dayId);
                if (!day) return setTargetSheet(null);
                const sets = Math.max(1, Math.min(10, Math.round(parseFloat(targetSheet.sets)) || 0)) || undefined;
                const reps = targetSheet.reps.trim() || undefined;
                updateDay(targetSheet.dayId, {
                  exercises: day.exercises.map((x, i) =>
                    i !== targetSheet.idx ? x : { ...x, targetSets: targetSheet.sets.trim() ? sets : undefined, targetReps: reps },
                  ),
                });
                haptics.success();
                setTargetSheet(null);
              }}
            >
              Save target
            </Button>
          </div>
        )}
      </Sheet>

      {/* Snapshot the current split so you can come back to it later. */}
      <Sheet open={presetName !== null} onClose={() => setPresetName(null)} title="Save as preset">
        <p className="text-sm text-fg-muted leading-relaxed -mt-1 mb-3.5">
          Keeps a copy of these {split.length} day{split.length === 1 ? '' : 's'} you can reload any time from
          Templates → Saved. Your current split stays exactly as it is.
        </p>
        <input
          autoFocus
          value={presetName ?? ''}
          onChange={(e) => setPresetName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') savePreset();
          }}
          placeholder="Preset name"
          maxLength={40}
          aria-label="Preset name"
          className="w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong mb-3"
        />
        <Button variant="accent" size="lg" fullWidth disabled={!presetName?.trim()} onClick={savePreset}>
          Save preset
        </Button>
      </Sheet>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[110px] z-50 bg-fg text-canvas text-sm font-medium px-4 py-2.5 rounded-btn shadow-pop">
          {toast}
        </div>
      )}

      <Sheet open={!!nameSheet} onClose={() => setNameSheet(null)} title={nameSheet?.id ? 'Rename day' : 'New day'}>
        <input
          autoFocus
          value={nameSheet?.value ?? ''}
          onChange={(e) => setNameSheet((s) => (s ? { ...s, value: e.target.value } : s))}
          onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }}
          placeholder="e.g. Push, Legs, Upper…"
          className="w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong mb-3"
        />
        <Button variant="accent" size="lg" fullWidth onClick={saveName}>
          {nameSheet?.id ? 'Save' : 'Add day'}
        </Button>
      </Sheet>
    </div>
  );
}
