import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { cn } from '../lib/cn';
import { haptics } from '../lib/haptics';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type MuscleGroup } from '../data/exercises';

/** Searchable exercise picker. Stays open after a pick so several can be added;
 *  already-added names (via `exclude`) show as "Added". */
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
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<MuscleGroup | 'All'>('All');

  const excludeSet = useMemo(() => new Set(exclude.map((e) => e.toLowerCase())), [exclude]);
  const results = useMemo(
    () =>
      EXERCISE_LIBRARY.filter((e) => {
        if (group !== 'All' && e.group !== group) return false;
        if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [q, group],
  );

  const customName = q.trim();
  const showCustom =
    customName.length > 0 &&
    !EXERCISE_LIBRARY.some((e) => e.name.toLowerCase() === customName.toLowerCase());

  const pick = (name: string) => {
    haptics.select();
    onPick(name);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
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

      {showCustom && (
        <button
          onClick={() => pick(customName)}
          className="w-full flex items-center gap-2.5 px-3 h-12 rounded-btn bg-accent-soft text-accent font-semibold mb-2"
        >
          <Plus size={18} /> Add “{customName}”
        </button>
      )}

      <div className="space-y-1">
        {results.map((e) => {
          const added = excludeSet.has(e.name.toLowerCase());
          return (
            <button
              key={e.name}
              disabled={added}
              onClick={() => pick(e.name)}
              className={cn(
                'w-full flex items-center justify-between px-3 h-12 rounded-btn text-left transition-colors',
                added ? 'opacity-40' : 'active:bg-surface-2',
              )}
            >
              <span className="font-medium">{e.name}</span>
              <span className="text-[11px] text-fg-subtle">{added ? 'Added' : e.group}</span>
            </button>
          );
        })}
        {results.length === 0 && !showCustom && (
          <div className="text-center text-fg-muted text-sm py-6">No matches</div>
        )}
      </div>
    </Sheet>
  );
}
