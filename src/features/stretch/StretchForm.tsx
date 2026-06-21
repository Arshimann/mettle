import { useState } from 'react';
import { Button, Sheet } from '../../components/ui';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { FIGURE_KINDS, type FigureKind } from './figures';
import { StretchFigure } from './StretchFigure';

const inputCls =
  'w-full h-12 px-3.5 rounded-btn bg-surface-2 border border-border text-[15px] outline-none focus:border-border-strong';

export function StretchForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addCustomStretch = useStore((s) => s.addCustomStretch);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [hold, setHold] = useState('30s');
  const [steps, setSteps] = useState('');
  const [illustration, setIllustration] = useState<FigureKind>('stand');

  const reset = () => {
    setName('');
    setTarget('');
    setHold('30s');
    setSteps('');
    setIllustration('stand');
  };

  const save = () => {
    if (!name.trim()) return;
    addCustomStretch({
      name: name.trim(),
      target: target.trim() || 'Custom',
      hold: hold.trim() || '30s',
      steps: steps.trim(),
      illustration,
    });
    haptics.success();
    reset();
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add a stretch">
      <div className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputCls} />
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target (e.g. Hamstrings)" className={inputCls} />
        <input value={hold} onChange={(e) => setHold(e.target.value)} placeholder="Hold (e.g. 30s / 10 reps)" className={inputCls} />
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="How to do it"
          rows={3}
          className={cn(inputCls, 'h-auto py-3 resize-none leading-relaxed')}
        />

        <div>
          <div className="text-[13px] font-semibold text-fg-muted mb-2">Illustration</div>
          <div className="grid grid-cols-5 gap-2">
            {FIGURE_KINDS.map((k) => (
              <button
                key={k}
                onClick={() => { haptics.tap(); setIllustration(k); }}
                aria-label={k}
                className={cn(
                  'aspect-square rounded-btn grid place-items-center border transition-colors',
                  illustration === k ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface-2 text-fg-muted',
                )}
              >
                <StretchFigure kind={k} animated={false} className="w-8 h-8" />
              </button>
            ))}
          </div>
        </div>

        <Button variant="accent" size="lg" fullWidth onClick={save} className="mt-1">
          Save stretch
        </Button>
      </div>
    </Sheet>
  );
}
