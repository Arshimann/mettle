import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Button, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { STRETCH_CATEGORIES, type Stretch } from '../../data/stretches';
import { StretchFigure } from './StretchFigure';

const inputCls =
  'w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong';

export function RoutineBuilder({ open, onClose }: { open: boolean; onClose: () => void }) {
  const customStretches = useStore((s) => s.customStretches);
  const addCustomRoutine = useStore((s) => s.addCustomRoutine);

  const [name, setName] = useState('');
  const [picked, setPicked] = useState<Stretch[]>([]);

  // De-duped pool of every stretch the user can pull from.
  const pool = useMemo(() => {
    const seen = new Set<string>();
    const out: Stretch[] = [];
    const push = (s: Stretch) => {
      const k = s.name.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(s);
      }
    };
    STRETCH_CATEGORIES.forEach((c) => c.stretches.forEach(push));
    customStretches.forEach(push);
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [customStretches]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= picked.length) return;
    haptics.tap();
    setPicked((p) => {
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const save = () => {
    if (!name.trim() || picked.length === 0) return;
    addCustomRoutine({ name: name.trim(), stretches: picked });
    haptics.success();
    setName('');
    setPicked([]);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Build a routine">
      <div className="space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Routine name" className={inputCls} />

        {picked.length > 0 && (
          <div>
            <div className="text-[13px] font-semibold text-fg-muted mb-2">In this routine · {picked.length}</div>
            <div className="space-y-2">
              {picked.map((s, i) => (
                <div key={`${s.name}-${i}`} className="flex items-center gap-2 bg-accent-soft/60 rounded-btn pl-2 pr-1 h-12">
                  <StretchFigure kind={s.illustration} animated={false} className="w-7 h-7 text-accent shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-[14px] font-medium">{s.name}</span>
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="w-7 h-8 grid place-items-center text-fg-muted disabled:opacity-25">
                    <ChevronUp size={16} />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === picked.length - 1} aria-label="Move down" className="w-7 h-8 grid place-items-center text-fg-muted disabled:opacity-25">
                    <ChevronDown size={16} />
                  </button>
                  <button
                    onClick={() => { haptics.tap(); setPicked((p) => p.filter((_, k) => k !== i)); }}
                    aria-label="Remove"
                    className="w-8 h-8 grid place-items-center text-fg-subtle"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-[13px] font-semibold text-fg-muted mb-2">Add stretches</div>
          <div className="space-y-1.5 max-h-[34vh] overflow-y-auto no-scrollbar -mx-1 px-1">
            {pool.map((s) => (
              <button
                key={s.name}
                onClick={() => { haptics.tap(); setPicked((p) => [...p, s]); }}
                className="w-full flex items-center gap-2.5 bg-surface-2 rounded-btn px-2.5 h-11 text-left"
              >
                <StretchFigure kind={s.illustration} animated={false} className="w-7 h-7 text-fg-muted shrink-0" />
                <span className="flex-1 min-w-0 truncate text-[14px]">{s.name}</span>
                <Plus size={16} className="text-accent shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="accent"
          size="lg"
          fullWidth
          onClick={save}
          className={cn(!name.trim() || picked.length === 0 ? 'opacity-50 pointer-events-none' : '')}
        >
          Save routine{picked.length ? ` · ${picked.length}` : ''}
        </Button>
      </div>
    </Sheet>
  );
}
