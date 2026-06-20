import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Card, CardLabel, EmptyState, PageHeader } from '../../components/ui';
import { listContainer, listItem } from '../../theme/motion';
import { useStore } from '../../store/useStore';
import { fmtWeight, unitLabel } from '../../lib/units';
import { prettyDate } from '../../lib/date';

export function Progress() {
  const prs = useStore((s) => s.prs);
  const history = useStore((s) => s.history);
  const units = useStore((s) => s.settings.units);

  if (prs.length === 0 && history.length === 0) {
    return (
      <div>
        <PageHeader title="Progress" subtitle="PRs, charts & history" />
        <Card className="p-0">
          <EmptyState
            icon={TrendingUp}
            title="Nothing logged yet"
            body="Finish your first workout and your records, charts, and history appear here."
          />
        </Card>
      </div>
    );
  }

  return (
    <motion.div variants={listContainer} initial="hidden" animate="show">
      <PageHeader title="Progress" subtitle={`${history.length} workouts logged`} />
      {prs.length > 0 && (
        <motion.div variants={listItem}>
          <Card>
            <CardLabel>Personal records</CardLabel>
            <div className="divide-y divide-border">
              {prs.slice(0, 8).map((pr) => (
                <div key={pr.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{pr.exercise}</div>
                    <div className="text-xs text-fg-subtle">{prettyDate(pr.date)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold tabular">{fmtWeight(pr.weight, units)}</span>
                    <span className="text-sm text-fg-muted"> {unitLabel(units)} × {pr.reps}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
