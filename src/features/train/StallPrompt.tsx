import { useState } from 'react';
import { BatteryLow, Flame, TrendingDown } from 'lucide-react';
import { Button, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import type { StallReason } from '../../types';

const OPTIONS: { id: StallReason; label: string; blurb: string; icon: typeof Flame }[] = [
  { id: 'deload', label: 'Planned deload', blurb: 'Backing off on purpose', icon: TrendingDown },
  { id: 'fatigue', label: 'Felt drained', blurb: 'Sleep, stress, or under-eating', icon: BatteryLow },
  { id: 'pushing', label: 'Still pushing', blurb: 'Just a slow week', icon: Flame },
];

/**
 * Asked once, right after saving, for lifts whose estimated 1RM hasn't moved
 * in a few sessions. A plateau means something different depending on whether
 * you chose it — that answer is worth more than any number the app can infer.
 */
export function StallPrompt({
  exercises,
  onDone,
}: {
  exercises: string[];
  onDone: (reasons: Record<string, StallReason>) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, StallReason>>({});
  if (exercises.length === 0) return null;

  const answeredAll = exercises.every((n) => answers[n]);

  return (
    <Sheet open onClose={() => onDone(answers)} title={exercises.length === 1 ? 'One lift stalled' : 'A few lifts stalled'}>
      <p className="text-sm text-fg-muted leading-relaxed -mt-1 mb-4">
        {exercises.length === 1 ? 'This one hasn’t' : 'These haven’t'} moved in a few sessions. Tell the app why and
        it can read your training properly — a chosen deload isn’t the same as running on empty.
      </p>

      <div className="space-y-4">
        {exercises.map((name) => (
          <div key={name}>
            <div className="font-semibold text-[15px] mb-2 truncate">{name}</div>
            <div className="grid grid-cols-3 gap-2">
              {OPTIONS.map((o) => {
                const Icon = o.icon;
                const active = answers[name] === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => {
                      haptics.select();
                      setAnswers((a) => ({ ...a, [name]: o.id }));
                    }}
                    className={cn(
                      'rounded-card border p-2.5 text-left transition-colors',
                      active ? 'border-accent bg-accent-soft' : 'border-border bg-surface-2',
                    )}
                  >
                    <Icon size={16} className={cn('mb-1.5', active ? 'text-accent' : 'text-fg-subtle')} />
                    <div className="text-[12px] font-semibold leading-tight">{o.label}</div>
                    <div className="text-[10px] text-fg-subtle leading-tight mt-0.5">{o.blurb}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Button variant="accent" size="lg" fullWidth className="mt-5" onClick={() => onDone(answers)}>
        {answeredAll ? 'Done' : 'Skip for now'}
      </Button>
    </Sheet>
  );
}
