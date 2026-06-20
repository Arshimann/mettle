import { useState } from 'react';
import { Star } from 'lucide-react';
import { Sheet, Button } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { unitLabel } from '../../lib/units';

export function FinishSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (meta: { rating?: number; note?: string }) => void;
}) {
  const session = useStore((s) => s.activeSession);
  const units = useStore((s) => s.settings.units);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');

  if (!session) return null;

  const doneSets = session.exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.done).length,
    0,
  );
  const exercisesWorked = session.exercises.filter((ex) => ex.sets.some((s) => s.done)).length;
  const volume = session.exercises.reduce(
    (v, ex) =>
      v +
      ex.sets.reduce(
        (s, set) => (set.done ? s + (Number(set.weight) || 0) * (Number(set.reps) || 0) : s),
        0,
      ),
    0,
  );

  return (
    <Sheet open={open} onClose={onClose} title="Finish workout">
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-surface-2 rounded-btn py-3 text-center">
          <div className="text-2xl font-bold tabular leading-none">{exercisesWorked}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle mt-1.5">
            Exercises
          </div>
        </div>
        <div className="bg-surface-2 rounded-btn py-3 text-center">
          <div className="text-2xl font-bold tabular leading-none">{doneSets}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle mt-1.5">
            Sets
          </div>
        </div>
        <div className="bg-surface-2 rounded-btn py-3 text-center">
          <div className="text-2xl font-bold tabular leading-none">
            {Math.round(volume).toLocaleString()}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle mt-1.5">
            {unitLabel(units)} vol
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium mb-2">How did it feel?</div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => {
                haptics.tap();
                setRating(n === rating ? 0 : n);
              }}
              aria-label={`${n} stars`}
              className="p-1"
            >
              <Star
                size={30}
                className={cn(n <= rating ? 'text-accent' : 'text-border-strong')}
                fill={n <= rating ? 'currentColor' : 'none'}
                strokeWidth={n <= rating ? 0 : 2}
              />
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notes (optional)…"
        rows={2}
        className="w-full p-3 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong resize-none mb-4"
      />

      <Button
        variant="accent"
        size="lg"
        fullWidth
        onClick={() => onConfirm({ rating: rating || undefined, note: note.trim() || undefined })}
      >
        Save workout
      </Button>
      {doneSets === 0 && (
        <p className="text-xs text-fg-muted text-center mt-2.5">
          No completed sets yet — saving will discard this session.
        </p>
      )}
    </Sheet>
  );
}
