import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { Button, Card, EmptyState, PageHeader } from '../../components/ui';
import { listContainer, listItem } from '../../theme/motion';
import { useStore } from '../../store/useStore';
import { useUI } from '../../store/useUI';

export function Split() {
  const split = useStore((s) => s.split);
  const navigate = useUI((s) => s.navigate);

  if (split.length === 0) {
    return (
      <div>
        <PageHeader title="Split" subtitle="Your training days" />
        <Card className="p-0">
          <EmptyState
            icon={LayoutGrid}
            title="No split yet"
            body="Set up your training days and the exercises in each one."
            action={
              <Button variant="accent" onClick={() => navigate('home')}>
                Go to setup
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <motion.div variants={listContainer} initial="hidden" animate="show">
      <PageHeader title="Split" subtitle={`${split.length} day${split.length === 1 ? '' : 's'}`} />
      <div className="space-y-3">
        {split.map((day) => (
          <motion.div key={day.id} variants={listItem}>
            <Card>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-lg">{day.name}</h3>
                <span className="text-xs text-fg-subtle">{day.exercises.length} exercises</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {day.exercises.map((ex, i) => (
                  <span
                    key={i}
                    className="text-[13px] px-2.5 py-1 rounded-btn bg-surface-2 text-fg-muted"
                  >
                    {ex.name}
                  </span>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
