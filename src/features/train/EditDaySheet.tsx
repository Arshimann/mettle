import { useState } from 'react';
import { GripVertical, Plus, X } from 'lucide-react';
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
import { Button, Sheet, Sortable, Stepper } from '../../components/ui';
import { ExercisePicker } from '../../components/ExercisePicker';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import type { SplitDay } from '../../types';

/**
 * Edit a day's exercises without leaving Train. Writes straight through to the
 * stored split via `updateDay`, so it's the same data the Split screen edits —
 * this is a second door onto it, not a copy.
 */
export function EditDaySheet({ day, onClose }: { day: SplitDay | null; onClose: () => void }) {
  const updateDay = useStore((s) => s.updateDay);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [target, setTarget] = useState<{ idx: number; name: string; sets: string; reps: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!day) return null;

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = day.exercises.map((x) => x.name);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    haptics.tap();
    updateDay(day.id, { exercises: arrayMove(day.exercises, from, to) });
  };

  const addExercise = (name: string) => {
    if (day.exercises.some((e) => e.name.toLowerCase() === name.toLowerCase())) return;
    const { defaultTargetSets, defaultTargetReps } = useStore.getState().settings;
    updateDay(day.id, {
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

  const saveTarget = () => {
    if (!target) return;
    const sets = Math.max(1, Math.min(10, Math.round(parseFloat(target.sets)) || 0)) || undefined;
    const reps = target.reps.trim() || undefined;
    updateDay(day.id, {
      exercises: day.exercises.map((x, i) =>
        i !== target.idx ? x : { ...x, targetSets: target.sets.trim() ? sets : undefined, targetReps: reps },
      ),
    });
    haptics.success();
    setTarget(null);
  };

  return (
    <>
      <Sheet open={!!day && !target} onClose={onClose} title={day.name}>
        <p className="text-sm text-fg-muted leading-relaxed -mt-1 mb-3.5">
          Changes save straight to your split — tap an exercise to set its sets × reps.
        </p>

        {day.exercises.length === 0 ? (
          <p className="text-sm text-fg-muted py-2">No exercises yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={day.exercises.map((x) => x.name)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5 mb-3">
                {day.exercises.map((ex, idx) => (
                  <Sortable key={ex.name} id={ex.name}>
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
                            setTarget({
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
                          onClick={() => {
                            updateDay(day.id, { exercises: day.exercises.filter((_, i) => i !== idx) });
                            haptics.tap();
                          }}
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
        )}

        <Button variant="outline" fullWidth size="sm" onClick={() => { haptics.tap(); setPickerOpen(true); }}>
          <Plus size={15} /> Add exercise
        </Button>
        <Button variant="accent" size="lg" fullWidth className="mt-3" onClick={onClose}>
          Done
        </Button>
      </Sheet>

      <Sheet open={!!target} onClose={() => setTarget(null)} title={target?.name}>
        {target && (
          <div className="space-y-3">
            <div>
              <div className="text-[13px] font-semibold text-fg-muted mb-1.5">Target sets</div>
              <Stepper
                value={target.sets}
                onChange={(v) => setTarget({ ...target, sets: v })}
                step={1}
                min={1}
                placeholder="3"
                aria-label="Target sets"
              />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-fg-muted mb-1.5">Target reps</div>
              <input
                value={target.reps}
                onChange={(e) => setTarget({ ...target, reps: e.target.value })}
                placeholder="8–12"
                className="w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong"
              />
            </div>
            <Button variant="accent" size="lg" fullWidth onClick={saveTarget}>
              Save target
            </Button>
          </div>
        )}
      </Sheet>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
        exclude={day.exercises.map((e) => e.name)}
      />
    </>
  );
}
