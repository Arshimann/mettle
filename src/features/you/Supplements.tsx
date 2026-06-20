import { useState } from 'react';
import { Check, Pill, Plus, X } from 'lucide-react';
import { Button, Card, CardLabel, EmptyState, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { todayStr } from '../../lib/date';

export function Supplements() {
  const supplements = useStore((s) => s.supplements);
  const taken = useStore((s) => s.supplementsTaken);
  const add = useStore((s) => s.addSupplement);
  const remove = useStore((s) => s.removeSupplement);
  const toggle = useStore((s) => s.toggleSupplementTaken);

  const today = todayStr();
  const takenIds = taken.date === today ? taken.ids : [];
  const doneCount = supplements.filter((s) => takenIds.includes(s.id)).length;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');

  const save = () => {
    if (!name.trim()) return;
    add({ name: name.trim(), dose: dose.trim() || undefined });
    haptics.success();
    setName('');
    setDose('');
    setOpen(false);
  };

  const inputCls =
    'w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong';

  return (
    <Card className={supplements.length === 0 ? 'p-0' : undefined}>
      {supplements.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="Daily stack"
          body="Add your supplements and check them off each day."
          action={<Button variant="accent" onClick={() => { haptics.tap(); setOpen(true); }}>Add supplement</Button>}
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div>
              <CardLabel className="mb-0">Daily stack</CardLabel>
              <div className="text-sm text-fg-muted mt-1">
                {doneCount}/{supplements.length} taken today
              </div>
            </div>
            <Button size="sm" variant="accent" onClick={() => { haptics.tap(); setOpen(true); }}>
              <Plus size={15} /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {supplements.map((s) => {
              const done = takenIds.includes(s.id);
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <button
                    onClick={() => { haptics.tap(); toggle(s.id); }}
                    aria-label={`Mark ${s.name} taken`}
                    className={cn(
                      'w-7 h-7 rounded-full grid place-items-center border shrink-0 transition-colors',
                      done ? 'bg-accent border-accent text-accent-fg' : 'bg-surface-2 border-border text-transparent',
                    )}
                  >
                    <Check size={15} strokeWidth={3} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={cn('font-medium truncate', done && 'line-through text-fg-muted')}>{s.name}</div>
                    {s.dose && <div className="text-xs text-fg-subtle">{s.dose}</div>}
                  </div>
                  <button onClick={() => remove(s.id)} className="text-fg-subtle shrink-0" aria-label="Remove supplement">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Add supplement">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. Creatine)"
          className={cn(inputCls, 'mb-2.5')}
        />
        <input
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
          placeholder="Dose — optional (e.g. 5g)"
          className={cn(inputCls, 'mb-3')}
        />
        <Button variant="accent" size="lg" fullWidth onClick={save}>
          Add
        </Button>
      </Sheet>
    </Card>
  );
}
