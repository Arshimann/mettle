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
import { Dumbbell, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button, Card, EmptyState, PageHeader, Sheet, Sortable } from '../../components/ui';
import { ExercisePicker } from '../../components/ExercisePicker';
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

  const [pickerForDay, setPickerForDay] = useState<string | null>(null);
  const [nameSheet, setNameSheet] = useState<{ id: string | null; value: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
    updateDay(pickerForDay, { exercises: [...day.exercises, { name }] });
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
          <Button size="sm" variant="accent" onClick={() => { haptics.tap(); setNameSheet({ id: null, value: '' }); }}>
            <Plus size={15} /> Day
          </Button>
        }
      />

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
                                        <span className="flex-1 min-w-0 truncate text-[15px] font-medium">{ex.name}</span>
                                        {ex.targetSets && (
                                          <span className="text-[12px] text-fg-subtle shrink-0">
                                            {ex.targetSets}×{ex.targetReps}
                                          </span>
                                        )}
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
