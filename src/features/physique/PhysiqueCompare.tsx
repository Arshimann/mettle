import { useEffect } from 'react';
import { X } from 'lucide-react';
import { haptics } from '../../lib/haptics';
import { daysBetween, prettyDate } from '../../lib/date';
import { fmtWeight, unitLabel } from '../../lib/units';
import { useStore } from '../../store/useStore';
import { useUI } from '../../store/useUI';
import type { PhysiquePost } from '../../lib/physique';
import { useSignedUrls } from './useSignedUrls';

/** Two of your own check-ins, side by side, with the gap and weight delta. */
export function PhysiqueCompare({
  a,
  b,
  onClose,
}: {
  a: PhysiquePost;
  b: PhysiquePost;
  onClose: () => void;
}) {
  const units = useStore((s) => s.settings.units);
  const pushOverlay = useUI((s) => s.pushOverlay);
  const popOverlay = useUI((s) => s.popOverlay);

  // Order oldest → newest so the progress reads left to right.
  const [older, newer] = a.takenOn <= b.takenOn ? [a, b] : [b, a];
  const urls = useSignedUrls([older.path, newer.path]);

  useEffect(() => {
    pushOverlay();
    return () => popOverlay();
  }, [pushOverlay, popOverlay]);

  const gap = daysBetween(older.takenOn, newer.takenOn);
  const delta =
    older.weightKg != null && newer.weightKg != null ? newer.weightKg - older.weightKg : null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-canvas flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <span className="font-semibold">Compare</span>
        <button
          onClick={() => {
            haptics.tap();
            onClose();
          }}
          aria-label="Close compare"
          className="w-9 h-9 grid place-items-center rounded-btn text-fg-muted"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-1.5 px-1.5">
        {[older, newer].map((p) => (
          <div key={p.id} className="min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 rounded-card overflow-hidden bg-surface-2">
              {urls.get(p.path) ? (
                <img src={urls.get(p.path)} alt={prettyDate(p.takenOn)} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full grid place-items-center text-fg-subtle text-sm">Loading…</div>
              )}
            </div>
            <div className="text-center py-2 shrink-0">
              <div className="text-[13px] font-semibold">{prettyDate(p.takenOn)}</div>
              {p.weightKg != null && (
                <div className="text-[12px] text-fg-muted tabular">
                  {fmtWeight(p.weightKg, units)}
                  {unitLabel(units)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        className="shrink-0 px-4 pt-2 text-center"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
      >
        <div className="inline-flex items-center gap-3 rounded-full bg-surface-2 border border-border px-4 h-10">
          <span className="text-[13px] font-semibold tabular">
            {gap} day{gap === 1 ? '' : 's'} apart
          </span>
          {delta != null && Math.abs(delta) >= 0.05 && (
            // Neutral styling on purpose — neither direction is "good".
            <span className="text-[13px] font-bold tabular text-accent" title="Change in logged body weight">
              {delta > 0 ? '+' : '−'}
              {fmtWeight(Math.abs(delta), units)}
              {unitLabel(units)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
