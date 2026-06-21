import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { listContainer, listItem } from '../../theme/motion';
import { RECOVERY_CATEGORIES, RECOVERY_DISCLAIMER } from '../../data/recovery';
import type { PlayableRoutine } from '../../data/stretches';
import { RoutinePlayer } from '../stretch/RoutinePlayer';
import { CategoryCard, RoutineDetailSheet, type CatalogItem } from '../stretch/RoutineDetailSheet';

export function Recovery() {
  const [active, setActive] = useState<CatalogItem | null>(null);
  const [playing, setPlaying] = useState<PlayableRoutine | null>(null);

  return (
    <div>
      <PageHeader title="Recovery" subtitle="Gentle mobility by body area" />

      <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-3">
        <motion.div
          variants={listItem}
          className="flex gap-2.5 rounded-card bg-surface-2 border border-border p-3.5 text-xs text-fg-muted leading-relaxed"
        >
          <Info size={16} className="text-fg-subtle shrink-0 mt-0.5" />
          <p>{RECOVERY_DISCLAIMER}</p>
        </motion.div>

        {RECOVERY_CATEGORIES.map((cat) => (
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

      {playing && <RoutinePlayer routine={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
