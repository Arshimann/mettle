import { useState } from 'react';
import { motion } from 'framer-motion';
import { ListChecks, Plus, Search, Trash2, Wand2 } from 'lucide-react';
import { Card, PageHeader, Sheet } from '../../components/ui';
import { listContainer, listItem } from '../../theme/motion';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { STRETCH_CATEGORIES, type PlayableRoutine } from '../../data/stretches';
import { RoutinePlayer } from './RoutinePlayer';
import { CategoryCard, RoutineDetailSheet, type CatalogItem } from './RoutineDetailSheet';
import { AllStretches } from './AllStretches';
import { StretchForm } from './StretchForm';
import { RoutineBuilder } from './RoutineBuilder';

export function Stretch() {
  const customRoutines = useStore((s) => s.customRoutines);
  const removeCustomRoutine = useStore((s) => s.removeCustomRoutine);

  const [active, setActive] = useState<CatalogItem | null>(null);
  const [playing, setPlaying] = useState<PlayableRoutine | null>(null);
  const [menu, setMenu] = useState(false);
  const [browse, setBrowse] = useState(false);
  const [addStretch, setAddStretch] = useState(false);
  const [build, setBuild] = useState(false);

  return (
    <div>
      <PageHeader
        title="Stretch"
        subtitle="Mobility, posture & recovery"
        action={
          <button
            onClick={() => { haptics.tap(); setMenu(true); }}
            className="w-9 h-9 grid place-items-center rounded-btn bg-accent text-accent-fg"
            aria-label="Create"
          >
            <Plus size={20} />
          </button>
        }
      />

      <button
        onClick={() => { haptics.tap(); setBrowse(true); }}
        className="w-full flex items-center gap-2.5 h-11 px-3.5 mb-3.5 rounded-btn bg-surface-2 border border-border text-fg-muted text-[14px]"
      >
        <Search size={16} />
        Browse all stretches
      </button>

      <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-3">
        {customRoutines.length > 0 && (
          <motion.div variants={listItem} className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle px-0.5">Your routines</div>
            {customRoutines.map((r) => (
              <Card key={r.id} className="flex items-center gap-3.5">
                <button onClick={() => { haptics.tap(); setActive(r); }} className="flex items-center gap-3.5 flex-1 min-w-0 text-left">
                  <div className="w-11 h-11 rounded-btn bg-accent-soft text-accent grid place-items-center shrink-0">
                    <ListChecks size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{r.name}</div>
                    <div className="text-xs text-fg-muted">{r.stretches.length} stretches · custom</div>
                  </div>
                </button>
                <button
                  onClick={() => { haptics.warn(); removeCustomRoutine(r.id); }}
                  aria-label={`Delete ${r.name}`}
                  className="w-9 h-9 grid place-items-center rounded-btn text-fg-subtle shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            ))}
          </motion.div>
        )}

        {STRETCH_CATEGORIES.map((cat) => (
          <motion.div key={cat.id} variants={listItem}>
            <CategoryCard item={cat} onOpen={() => setActive(cat)} />
          </motion.div>
        ))}
      </motion.div>

      <RoutineDetailSheet
        active={active}
        onClose={() => setActive(null)}
        onPlay={(r) => { setPlaying(r); setActive(null); }}
      />

      {/* Create menu */}
      <Sheet open={menu} onClose={() => setMenu(false)} title="Create">
        <div className="space-y-2.5">
          <button
            onClick={() => { haptics.tap(); setMenu(false); setBuild(true); }}
            className="w-full flex items-center gap-3.5 p-4 rounded-card bg-surface-2 text-left"
          >
            <div className="w-11 h-11 rounded-btn bg-accent-soft text-accent grid place-items-center shrink-0">
              <Wand2 size={20} />
            </div>
            <div>
              <div className="font-semibold">Build a routine</div>
              <div className="text-xs text-fg-muted">Pick and order your own sequence</div>
            </div>
          </button>
          <button
            onClick={() => { haptics.tap(); setMenu(false); setAddStretch(true); }}
            className="w-full flex items-center gap-3.5 p-4 rounded-card bg-surface-2 text-left"
          >
            <div className="w-11 h-11 rounded-btn bg-accent-soft text-accent grid place-items-center shrink-0">
              <Plus size={20} />
            </div>
            <div>
              <div className="font-semibold">Add a stretch</div>
              <div className="text-xs text-fg-muted">Save your own move to the library</div>
            </div>
          </button>
        </div>
      </Sheet>

      <AllStretches open={browse} onClose={() => setBrowse(false)} />
      <StretchForm open={addStretch} onClose={() => setAddStretch(false)} />
      <RoutineBuilder open={build} onClose={() => setBuild(false)} />

      {playing && <RoutinePlayer routine={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
