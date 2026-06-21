import { motion } from 'framer-motion';
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

const CARDS = [BodyWeight, Goals, TrainingStyleCard, Supplements, Consistency, Coach, Achievements, OneRm, Stopwatch];

export function You() {
  return (
    <div>
      <PageHeader title="You" subtitle="Body, goals & tools" />
      <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-3.5">
        {CARDS.map((C, i) => (
          <motion.div key={i} variants={listItem}>
            <C />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
