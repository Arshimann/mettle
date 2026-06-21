import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ListChecks, Play, Plus, Search, Trash2, Wand2 } from 'lucide-react';
import { Button, Card, PageHeader, Sheet } from '../../components/ui';
import { listContainer, listItem } from '../../theme/motion';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { STRETCH_CATEGORIES, type PlayableRoutine, type Stretch } from '../../data/stretches';
import { RoutinePlayer } from './RoutinePlayer';
import { StretchFigure } from './StretchFigure';
import { AllStretches } from './AllStretches';
import { StretchForm } from './StretchForm';
import { RoutineBuilder } from './RoutineBuilder';

type Detail = { name: string; desc?: string; stretches: Stretch[] };

export function Stretch() {
  const customRoutines = useStore((s) => s.customRoutines);
  const removeCustomRoutine = useStore((s) => s.removeCustomRoutine);

  const [active, setActive] = useState<Detail | null>(null);
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
                <button
                  onClick={() => { haptics.tap(); setActive(r); }}
                  className="flex items-center gap-3.5 flex-1 min-w-0 text-left"
                >
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

      {/* Category / routine detail */}
      <Sheet open={!!active} onClose={() => setActive(null)} title={active?.name}>
        {active?.desc && <p className="text-sm text-fg-muted mb-3 -mt-1">{active.desc}</p>}
        {active && (
          <Button
            variant="accent"
            size="lg"
            fullWidth
            className="mb-4"
            onClick={() => {
              haptics.tap();
              setPlaying({ name: active.name, stretches: active.stretches });
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
