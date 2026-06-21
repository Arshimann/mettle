import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { STRETCH_CATEGORIES, type Stretch } from '../../data/stretches';
import { StretchFigure } from './StretchFigure';

/** Flatten built-in + custom stretches, de-duped by name. */
function useAllStretches(): Stretch[] {
  const custom = useStore((s) => s.customStretches);
  return useMemo(() => {
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
    custom.forEach(push);
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [custom]);
}

export function AllStretches({ open, onClose }: { open: boolean; onClose: () => void }) {
  const all = useAllStretches();
  const [q, setQ] = useState('');
  const [openName, setOpenName] = useState<string | null>(null);

  const query = q.trim().toLowerCase();
  const list = query
    ? all.filter((s) => `${s.name} ${s.target}`.toLowerCase().includes(query))
    : all;

  return (
    <Sheet open={open} onClose={onClose} title="All stretches">
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${all.length} stretches`}
          className="w-full h-11 pl-10 pr-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong"
        />
      </div>

      <div className="space-y-2">
        {list.map((s) => {
          const expanded = openName === s.name;
          return (
            <button
              key={s.name}
              onClick={() => { haptics.tap(); setOpenName(expanded ? null : s.name); }}
              className="w-full text-left bg-surface-2 rounded-card p-3 flex gap-3 items-start"
            >
              <div className="w-12 h-12 shrink-0 rounded-btn bg-canvas/50 text-accent grid place-items-center">
                <StretchFigure kind={s.illustration} animated={false} className="w-9 h-9" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold truncate">{s.name}</span>
                  <span className="text-[11px] font-bold text-accent shrink-0 whitespace-nowrap">{s.hold}</span>
                </div>
                <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold mt-0.5">{s.target}</div>
                <p className={cn('text-sm text-fg-muted leading-relaxed mt-1', !expanded && 'line-clamp-1')}>{s.steps}</p>
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <p className="text-sm text-fg-muted text-center py-8">No stretches match “{q}”.</p>
        )}
      </div>
    </Sheet>
  );
}
