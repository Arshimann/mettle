import { Award, MessageCircle } from 'lucide-react';
import { Card } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { sfxPop } from '../../lib/sound';
import { prettyDate } from '../../lib/date';
import { sessionVolume } from '../../lib/formulas';
import { fromKg, unitLabel } from '../../lib/units';
import type { Units } from '../../types';
import type { FriendWorkout, WorkoutReaction } from '../../types/social';

const REACTION_EMOJI = ['💪', '🔥', '👏', '😮', '🎉'] as const;

/** A friend's published workout: summary line, emoji reactions, comments entry. */
export function WorkoutSocialCard({
  workout,
  units,
  myId,
  reactions,
  onReact,
  onOpenComments,
}: {
  workout: FriendWorkout;
  units: Units;
  myId: string;
  reactions: WorkoutReaction[];
  /** emoji to set, or null to clear my reaction */
  onReact: (emoji: string | null) => void;
  onOpenComments: () => void;
}) {
  const sets = workout.exercises.reduce((n, ex) => n + ex.sets.length, 0);
  const vol = Math.round(fromKg(sessionVolume(workout.exercises), units));
  const mine = reactions.find((r) => r.reactorId === myId)?.emoji ?? null;
  const counts = new Map<string, number>();
  for (const r of reactions) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[16px] truncate">{workout.dayName}</h3>
        <span className="text-xs text-fg-muted shrink-0">{prettyDate(workout.date)}</span>
      </div>
      <p className="text-[13px] text-fg-muted mt-1">
        {workout.exercises.length} exercise{workout.exercises.length === 1 ? '' : 's'} · {sets} sets
        {vol > 0 && (
          <>
            {' '}
            · {vol.toLocaleString()} {unitLabel(units)} vol
          </>
        )}
      </p>
      {workout.prNames.length > 0 && (
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-accent mt-1.5">
          <Award size={14} /> PR: {workout.prNames.join(', ')}
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-3">
        {REACTION_EMOJI.map((e) => {
          const n = counts.get(e) ?? 0;
          const active = mine === e;
          return (
            <button
              key={e}
              onClick={() => {
                haptics.select();
                sfxPop();
                onReact(active ? null : e);
              }}
              aria-label={`React ${e}`}
              aria-pressed={active}
              className={cn(
                'h-8 min-w-8 px-1.5 rounded-full border text-[14px] leading-none inline-flex items-center justify-center gap-1 transition-colors',
                active ? 'border-accent bg-accent-soft' : 'border-border bg-surface-2',
              )}
            >
              <span>{e}</span>
              {n > 0 && <span className="text-[11px] font-bold tabular text-fg-muted">{n}</span>}
            </button>
          );
        })}
        <button
          onClick={() => {
            haptics.tap();
            onOpenComments();
          }}
          aria-label="Comments"
          className="ml-auto h-8 px-2.5 rounded-full border border-border bg-surface-2 text-fg-muted inline-flex items-center gap-1.5 text-[12px] font-semibold"
        >
          <MessageCircle size={14} /> Comments
        </button>
      </div>
    </Card>
  );
}
