import { Dumbbell } from 'lucide-react';
import { Button, Card, CardLabel, EmptyState } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { useUI } from '../../store/useUI';

export function Train() {
  const session = useStore((s) => s.activeSession);
  const cancelSession = useStore((s) => s.cancelSession);
  const navigate = useUI((s) => s.navigate);

  if (!session) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={Dumbbell}
          title="No active workout"
          body="Start a session from one of your training days to begin logging sets."
          action={
            <Button variant="accent" onClick={() => navigate('home')}>
              Choose a day
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3.5">
      <Card>
        <CardLabel>In progress</CardLabel>
        <h1 className="text-2xl mb-1">{session.dayName}</h1>
        <p className="text-sm text-fg-muted">{session.exercises.length} exercises queued.</p>
      </Card>

      <div className="space-y-2.5">
        {session.exercises.map((ex, i) => (
          <Card key={i} className="flex items-center justify-between py-3.5">
            <span className="font-medium">{ex.name}</span>
            <span className="text-xs text-fg-subtle">{ex.sets.length} set</span>
          </Card>
        ))}
      </div>

      <Button
        variant="danger"
        fullWidth
        onClick={() => {
          cancelSession();
          navigate('home');
        }}
      >
        Discard workout
      </Button>
    </div>
  );
}
