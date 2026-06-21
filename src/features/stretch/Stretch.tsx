import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Play } from 'lucide-react';
import { Button, Card, PageHeader, Sheet } from '../../components/ui';
import { listContainer, listItem } from '../../theme/motion';
import { haptics } from '../../lib/haptics';
import { STRETCH_CATEGORIES, type StretchCategory } from '../../data/stretches';
import { RoutinePlayer } from './RoutinePlayer';
import { StretchFigure } from './StretchFigure';

export function Stretch() {
  const [active, setActive] = useState<StretchCategory | null>(null);
  const [playing, setPlaying] = useState<StretchCategory | null>(null);

  return (
    <div>
      <PageHeader title="Stretch" subtitle="Mobility, posture & recovery" />
      <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-3">
        {STRETCH_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <motion.div key={cat.id} variants={listItem}>
              <Card
                onClick={() => { haptics.tap(); setActive(cat); }}
                className="flex items-center gap-3.5 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-btn bg-accent-soft text-accent grid place-items-center shrink-0">
                  <Icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{cat.name}</div>
                  <div className="text-xs text-fg-muted truncate">{cat.desc}</div>
                </div>
                <div className="flex items-center gap-1 text-fg-subtle shrink-0">
                  <span className="text-xs tabular">{cat.stretches.length}</span>
                  <ChevronRight size={16} />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <Sheet open={!!active} onClose={() => setActive(null)} title={active?.name}>
        <p className="text-sm text-fg-muted mb-3 -mt-1">{active?.desc}</p>
        {active && (
          <Button
            variant="accent"
            size="lg"
            fullWidth
            className="mb-4"
            onClick={() => {
              haptics.tap();
              setPlaying(active);
              setActive(null);
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
                <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold mb-1.5">
                  {s.target}
                </div>
                <p className="text-sm text-fg-muted leading-relaxed">{s.steps}</p>
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      {playing && <RoutinePlayer category={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
