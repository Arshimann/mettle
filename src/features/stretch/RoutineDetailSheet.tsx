import { Play } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Card, Sheet } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import type { PlayableRoutine, Stretch } from '../../data/stretches';
import { StretchFigure } from './StretchFigure';

export interface CatalogItem {
  name: string;
  desc?: string;
  icon?: LucideIcon;
  stretches: Stretch[];
}

/** A tappable category/routine card — shared by the Stretch and Recovery screens. */
export function CategoryCard({ item, onOpen }: { item: CatalogItem; onOpen: () => void }) {
  const Icon = item.icon;
  return (
    <Card onClick={() => { haptics.tap(); onOpen(); }} className="flex items-center gap-3.5 cursor-pointer">
      <div className="w-11 h-11 rounded-btn bg-accent-soft text-accent grid place-items-center shrink-0">
        {Icon ? <Icon size={22} /> : <Play size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{item.name}</div>
        {item.desc && <div className="text-xs text-fg-muted truncate">{item.desc}</div>}
      </div>
      <span className="text-xs tabular text-fg-subtle shrink-0">{item.stretches.length}</span>
    </Card>
  );
}

/** Detail sheet listing each stretch with its figure, plus a "start guided
 *  routine" action. Shared so Stretch and Recovery stay in sync. */
export function RoutineDetailSheet({
  active,
  onClose,
  onPlay,
}: {
  active: CatalogItem | null;
  onClose: () => void;
  onPlay: (routine: PlayableRoutine) => void;
}) {
  return (
    <Sheet open={!!active} onClose={onClose} title={active?.name}>
      {active?.desc && <p className="text-sm text-fg-muted mb-3 -mt-1">{active.desc}</p>}
      {active && (
        <Button
          variant="accent"
          size="lg"
          fullWidth
          className="mb-4"
          onClick={() => {
            haptics.tap();
            onPlay({ name: active.name, stretches: active.stretches });
          }}
        >
          <Play size={18} fill="currentColor" strokeWidth={0} /> Start guided routine
        </Button>
      )}
      <div className="space-y-3">
        {active?.stretches.map((s, i) => (
          <div key={i} className="bg-surface-2 rounded-card p-3.5 flex gap-3.5">
            <div className="w-16 h-16 shrink-0 rounded-btn bg-canvas/50 text-accent grid place-items-center">
              <StretchFigure kind={s.illustration} className="w-12 h-12" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold">{s.name}</h3>
                <span className="text-[11px] font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                  {s.hold}
                </span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold mb-1.5">{s.target}</div>
              <p className="text-sm text-fg-muted leading-relaxed">{s.steps}</p>
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
