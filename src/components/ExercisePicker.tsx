import { useMemo, useState } from 'react';
import { Plus, Search, Star, X } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { cn } from '../lib/cn';
import { haptics } from '../lib/haptics';
import { useStore } from '../store/useStore';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type MuscleGroup } from '../data/exercises';

/** Searchable exercise picker. Stays open after a pick so several can be added;
 *  already-added names (via `exclude`) show as "Added". Custom exercises are
 *  saved to the library (starred) so they're pickable forever after. */
export function ExercisePicker({
  open,
  onClose,
  onPick,
  exclude = [],
}: {
  open: boolean;
  onClose: () => void;
  onPick: (name: string) => void;
  exclude?: string[];
}) {
  const customExercises = useStore((s) => s.customExercises);
  const addCustomExercise = useStore((s) => s.addCustomExercise);
  const removeCustomExercise = useStore((s) => s.removeCustomExercise);

  const [q, setQ] = useState('');
  const [group, setGroup] = useState<MuscleGroup | 'All'>('All');
  // When adding a custom name with no group filter active, ask for a category.
  const [pendingCustom, setPendingCustom] = useState<string | null>(null);

  const excludeSet = useMemo(() => new Set(exclude.map((e) => e.toLowerCase())), [exclude]);

  // Built-ins + saved customs, one list. Customs carry a flag for the star.
  const all = useMemo(
    () => [
      ...EXERCISE_LIBRARY.map((e) => ({ ...e, customId: null as string | null })),
      ...customExercises.map((e) => ({ name: e.name, group: e.group, customId: e.id })),
    ],
    [customExercises],
  );

  const results = useMemo(
    () =>
      all.filter((e) => {
        if (group !== 'All' && e.group !== group) return false;
        if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [all, q, group],
  );

  const customName = q.trim();
  const showCustom =
    customName.length > 0 && !all.some((e) => e.name.toLowerCase() === customName.toLowerCase());

  const pick = (name: string) => {
    haptics.select();
    onPick(name);
  };

  /** Save a new custom exercise under `g`, then pick it. */
  const saveCustom = (name: string, g: MuscleGroup) => {
    addCustomExercise({ name, group: g });
    setPendingCustom(null);
    setQ('');
    pick(name);
  };

  const onAddCustom = () => {
    haptics.tap();
    // A specific group filter doubles as the category; otherwise ask.
    if (group !== 'All') saveCustom(customName, group);
    else setPendingCustom(customName);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPendingCustom(null);
          }}
          placeholder="Search or add custom…"
          className="w-full h-11 pl-9 pr-3 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1">
        {(['All', ...MUSCLE_GROUPS] as const).map((g) => (
          <button
            key={g}
            onClick={() => {
              haptics.tap();
              setGroup(g);
            }}
            className={cn(
              'shrink-0 px-3 h-8 rounded-full text-[13px] font-semibold border transition-colors',
              group === g
                ? 'bg-accent text-accent-fg border-accent'
                : 'bg-surface-2 text-fg-muted border-border',
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {showCustom && !pendingCustom && (
        <button
          onClick={onAddCustom}
          className="w-full flex items-center gap-2.5 px-3 h-12 rounded-btn bg-accent-soft text-accent font-semibold mb-2"
        >
          <Plus size={18} /> Add “{customName}”
        </button>
      )}

      {pendingCustom && (
        <div className="rounded-card bg-surface-2 p-3 mb-2">
          <div className="text-[13px] font-semibold mb-2">
            Save “{pendingCustom}” under…
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => { haptics.select(); saveCustom(pendingCustom, g); }}
                className="px-3 h-9 rounded-full text-[13px] font-semibold border border-border bg-canvas text-fg"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        {results.map((e) => {
          const added = excludeSet.has(e.name.toLowerCase());
          return (
            <div key={e.name} className="flex items-center gap-1">
              <button
                disabled={added}
                onClick={() => pick(e.name)}
                className={cn(
                  'flex-1 flex items-center justify-between px-3 h-12 rounded-btn text-left transition-colors min-w-0',
                  added ? 'opacity-40' : 'active:bg-surface-2',
                )}
              >
                <span className="font-medium truncate flex items-center gap-1.5">
                  {e.name}
                  {e.customId && (
                    <Star size={12} className="text-accent shrink-0" fill="currentColor" strokeWidth={0} />
                  )}
                </span>
                <span className="text-[11px] text-fg-subtle shrink-0 ml-2">{added ? 'Added' : e.group}</span>
              </button>
              {e.customId && (
                <button
                  onClick={() => { haptics.warn(); removeCustomExercise(e.customId!); }}
                  aria-label={`Remove custom exercise ${e.name}`}
                  className="w-9 h-9 grid place-items-center rounded-btn text-fg-subtle shrink-0"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          );
        })}
        {results.length === 0 && !showCustom && (
          <div className="text-center text-fg-muted text-sm py-6">No matches</div>
        )}
      </div>
    </Sheet>
  );
}
