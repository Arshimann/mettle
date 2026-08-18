import { useState } from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Info, Plus } from 'lucide-react';
import { Button, Card, CardLabel } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import type { Finding, MuscleReport, RegionRow } from '../../lib/muscleAnalysis';

const KIND_STYLE: Record<Finding['kind'], { label: string; tone: string; icon: typeof Info }> = {
  missing: { label: 'Not trained', tone: 'text-danger', icon: AlertTriangle },
  imbalance: { label: 'Lopsided', tone: 'text-warning', icon: AlertTriangle },
  under: { label: 'Under range', tone: 'text-warning', icon: Info },
  over: { label: 'Over range', tone: 'text-fg-muted', icon: Info },
  balanced: { label: 'Balanced', tone: 'text-success', icon: CheckCircle2 },
};

/** One region's weekly sets against its target band. */
function RegionBar({ row }: { row: RegionRow }) {
  const scaleMax = Math.max(row.target[1] * 1.4, row.perWeek * 1.1, 1);
  const pct = (n: number) => `${Math.min(100, (n / scaleMax) * 100)}%`;
  const fill =
    row.status === 'high' ? 'bg-danger' : row.status === 'low' ? 'bg-warning' : row.status === 'none' ? 'bg-surface-3' : 'bg-accent';

  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[13px] font-medium truncate">{row.label}</span>
        <span className="text-[12px] tabular text-fg-muted shrink-0">
          {row.perWeek}
          <span className="text-fg-subtle"> /wk</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-surface-2 overflow-hidden">
        {/* The target band, drawn behind the actual fill. */}
        <div
          className="absolute inset-y-0 bg-accent-soft"
          style={{ left: pct(row.target[0]), width: `calc(${pct(row.target[1])} - ${pct(row.target[0])})` }}
        />
        <div className={cn('absolute inset-y-0 left-0 rounded-full', fill)} style={{ width: pct(row.perWeek) }} />
      </div>
    </div>
  );
}

/**
 * The per-region read: what's lopsided, what's missing, and what to do about it
 * — sized to the muscle, so an isolation region never gets told to add a
 * session.
 */
export function MuscleBalance({
  report,
  onAddExercise,
}: {
  report: MuscleReport;
  onAddExercise?: (name: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  if (report.thin) {
    return (
      <Card>
        <CardLabel>Muscle balance</CardLabel>
        <p className="text-sm text-fg-muted leading-relaxed">
          Log a few more sessions and this fills in — it needs about six workouts before the numbers mean anything.
        </p>
      </Card>
    );
  }

  const shown = showAll ? report.rows : report.rows.filter((r) => r.sets > 0).slice(0, 8);

  return (
    <>
      {report.findings.map((f) => {
        const style = KIND_STYLE[f.kind];
        const Icon = style.icon;
        return (
          <Card key={f.id} className="mb-3.5">
            <div className={cn('flex items-center gap-1.5 mb-1.5', style.tone)}>
              <Icon size={14} />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{style.label}</span>
            </div>
            <p className="text-[15px] font-semibold leading-snug">{f.headline}</p>
            <p className="text-sm text-fg-muted leading-relaxed mt-1.5">{f.recommendation}</p>
            {f.suggestions.length > 0 && onAddExercise && (
              <div className="flex flex-wrap gap-2 mt-3">
                {f.suggestions.map((name) => (
                  <Button
                    key={name}
                    size="sm"
                    onClick={() => {
                      haptics.tap();
                      onAddExercise(name);
                    }}
                  >
                    <Plus size={14} /> {name}
                  </Button>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      <Card className="mb-3.5">
        <div className="flex items-baseline justify-between mb-1">
          <CardLabel className="mb-0">Weekly sets by region</CardLabel>
          <span className="text-[11px] text-fg-subtle">last {report.weeks} weeks</span>
        </div>
        <div className="divide-y divide-border">
          {shown.map((r) => (
            <RegionBar key={r.region} row={r} />
          ))}
        </div>
        <button
          onClick={() => {
            haptics.tap();
            setShowAll((v) => !v);
          }}
          className="w-full text-[13px] font-semibold text-accent mt-2.5 flex items-center justify-center gap-1"
        >
          {showAll ? 'Show trained only' : `Show all ${report.rows.length} regions`}
          <ArrowUpRight size={14} className={showAll ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
        <div className="flex items-center gap-3 mt-3 text-[11px] text-fg-subtle">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-accent-soft inline-block" /> Target range
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-accent inline-block" /> Your volume
          </span>
        </div>
        {report.unmapped.length > 0 && (
          <p className="text-[11px] text-fg-subtle mt-2.5 leading-snug">
            {report.unmapped.length} of your movements aren’t mapped to specific regions yet — they’re counted at
            group level.
          </p>
        )}
      </Card>
    </>
  );
}
