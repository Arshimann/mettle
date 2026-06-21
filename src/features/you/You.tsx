import { motion } from 'framer-motion';
import type { ComponentType } from 'react';
import { PageHeader } from '../../components/ui';
import { listContainer, listItem } from '../../theme/motion';
import { BodyWeight } from './BodyWeight';
import { Goals } from './Goals';
import { TrainingStyleCard } from './TrainingStyleCard';
import { Supplements } from './Supplements';
import { Consistency } from './Consistency';
import { Coach } from './Coach';
import { Achievements } from './Achievements';
import { OneRm } from './OneRm';
import { Stopwatch } from './Stopwatch';

/** Grouped so the screen reads as a few calm sections instead of one long
 *  stack of equal-weight cards. Pure utilities live last under "Tools". */
const SECTIONS: { title: string; cards: ComponentType[] }[] = [
  { title: 'Body', cards: [BodyWeight, Consistency, Coach] },
  { title: 'Goals & habits', cards: [Goals, TrainingStyleCard, Supplements, Achievements] },
  { title: 'Tools', cards: [OneRm, Stopwatch] },
];

export function You() {
  return (
    <div>
      <PageHeader title="You" subtitle="Body, goals & tools" />
      <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-7">
        {SECTIONS.map((sec) => (
          <div key={sec.title} className="space-y-3">
            <motion.div
              variants={listItem}
              className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle px-0.5"
            >
              {sec.title}
            </motion.div>
            {sec.cards.map((C, i) => (
              <motion.div key={i} variants={listItem}>
                <C />
              </motion.div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
