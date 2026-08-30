import { useMemo, useState } from 'react';
import { Plus, Search, Star, X } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { cn } from '../lib/cn';
import { haptics } from '../lib/haptics';
import { useStore } from '../store/useStore';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type MuscleGroup } from '../data/exercises';
import { regionsFor } from '../data/muscleMap';
import { groupOf } from '../lib/exerciseGroups';
import { INJURY_AREAS } from '../data/injuries';
import { gentlerAlternatives, kindLabel, strainFor, worstStrain } from '../lib/injuryAnalysis';
import { useUI } from '../store/useUI';

/** Searchable exercise picker. In 'add' mode it stays open after a pick so
 *  several can be added; already-added names (via `exclude`) show as "Added".
 *  Custom exercises are saved to the library (starred) so they're pickable
 *  forever after.
 *
 *  In 'replace' mode it swaps one movement for another, so it closes on pick
 *  and leads with movements that train the same thing — the moment you ask for
 *  a substitute is exactly when a shortlist is worth something. */
export function ExercisePicker({
  open,
  onClose,
  onPick,
  exclude = [],
  mode = 'add',
  replacing,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (name: string) => void;
  exclude?: string[];
  mode?: 'add' | 'replace';
  /** The movement being replaced. Names the sheet and seeds the shortlist. */
  replacing?: string;
}) {
  const customExercises = useStore((s) => s.customExercises);
  const addCustomExercise = useStore((s) => s.addCustomExercise);
  const removeCustomExercise = useStore((s) => s.removeCustomExercise);

  const injuries = useStore((s) => s.profile.injuries ?? []);
  const toast = useUI((s) => s.toast);
  const [kindOnly, setKindOnly] = useState(false);

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

  const results = useMemo(() => {
    const base = all.filter((e) => {
      if (group !== 'All' && e.group !== group) return false;
      if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    if (!kindOnly || injuries.length === 0) return base;
    // Hide only the worst offenders, then lead with the gentlest. Never hide
    // everything — the user is an adult and may have a reason.
    return base
      .filter((e) => worstStrain(e.name, e.group, injuries) < 1.5)
      .sort((a, b) => worstStrain(a.name, a.group, injuries) - worstStrain(b.name, b.group, injuries));
  }, [all, q, group, kindOnly, injuries]);

  const customName = q.trim();
  const showCustom =
    customName.length > 0 && !all.some((e) => e.name.toLowerCase() === customName.toLowerCase());

  /** Movements sharing the replaced lift's primary region, best overlap first.
   *  Costs nothing to build — the region resolver already covers customs. */
  const similar = useMemo(() => {
    if (mode !== 'replace' || !replacing) return [];
    const mine = regionsFor(replacing, groupOf(replacing, customExercises) ?? undefined);
    const primary = (Object.entries(mine) as [string, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!primary) return [];
    const lower = replacing.toLowerCase();
    return all
      .filter((e) => e.name.toLowerCase() !== lower && !excludeSet.has(e.name.toLowerCase()))
      .map((e) => {
        const theirs = regionsFor(e.name, e.group) as Record<string, number>;
        let overlap = 0;
        for (const [region, weight] of Object.entries(mine) as [string, number][]) {
          overlap += Math.min(weight, theirs[region] ?? 0);
        }
        return { e, primaryScore: theirs[primary] ?? 0, overlap };
      })
      .filter((x) => x.primaryScore > 0)
      // Asking for a substitute is the exact moment we know which substitutes
      // are kinder — so when areas are flagged, strain leads the ordering.
      .sort(
        (a, b) =>
          (injuries.length
            ? worstStrain(a.e.name, a.e.group, injuries) - worstStrain(b.e.name, b.e.group, injuries)
            : 0) ||
          b.primaryScore - a.primaryScore ||
          b.overlap - a.overlap,
      )
      .slice(0, 5)
      .map((x) => x.e);
  }, [mode, replacing, all, excludeSet, customExercises, injuries]);

  const pick = (name: string) => {
    haptics.select();
    onPick(name);
    // Suggested after the fact, never as a block: it respects the choice and
    // still offers the help.
    if (injuries.length > 0) {
      const g = groupOf(name, customExercises) ?? undefined;
      if (worstStrain(name, g, injuries) >= 1) {
        const alts = gentlerAlternatives(name, g, injuries, customExercises, 2);
        if (alts.length > 0) {
          toast({ message: `Added. Gentler options: ${alts.join(', ')}`, tone: 'neutral', duration: 4200 });
        }
      }
    }
    // Replacing is a single decision — staying open would be a second prompt.
    if (mode === 'replace') onClose();
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
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === 'replace' && replacing ? `Replace ${replacing}` : 'Add exercise'}
    >
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
        {injuries.length > 0 && (
          <button
            onClick={() => {
              haptics.tap();
              setKindOnly((v) => !v);
            }}
            aria-pressed={kindOnly}
            className={cn(
              'shrink-0 px-3 h-8 rounded-full text-[13px] font-semibold border transition-colors',
              kindOnly
                ? 'bg-warning text-canvas border-warning'
                : 'bg-surface-2 text-warning border-warning/50',
            )}
          >
            {kindLabel(injuries, (a) => INJURY_AREAS.find((x) => x.id === a)?.label ?? a)}
          </button>
        )}
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

      {similar.length > 0 && !q && (
        <div className="mb-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle mb-1.5 px-0.5">
            Similar movements
          </div>
          <div className="flex flex-wrap gap-1.5">
            {similar.map((e) => (
              <button
                key={e.name}
                onClick={() => pick(e.name)}
                className="px-3 h-9 rounded-full text-[13px] font-semibold border border-accent/45 bg-accent-soft text-accent"
              >
                {e.name}
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
                {(() => {
                  if (added) return <span className="text-[11px] text-fg-subtle shrink-0 ml-2">Added</span>;
                  const load = worstStrain(e.name, e.group, injuries);
                  if (load < 1) return <span className="text-[11px] text-fg-subtle shrink-0 ml-2">{e.group}</span>;
                  const why = strainFor(e.name, e.group).reason;
                  return (
                    <span
                      title={why}
                      className={cn(
                        'text-[10.5px] font-semibold shrink-0 ml-2 px-1.5 py-0.5 rounded-md max-w-[9rem] truncate',
                        load >= 1.5 ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning',
                      )}
                    >
                      {why || e.group}
                    </span>
                  );
                })()}
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
