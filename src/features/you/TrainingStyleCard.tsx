import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Card, CardLabel, Sheet } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { STYLE_DEFS } from '../../data/trainingStyles';
import { StyleQuiz } from '../onboarding/StyleQuiz';

export function TrainingStyleCard() {
  const style = useStore((s) => s.settings.trainingStyle);
  const [open, setOpen] = useState(false);
  const def = style ? STYLE_DEFS[style] : null;
  const Icon = def?.icon;

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <CardLabel className="mb-0">Training style</CardLabel>
        <button
          onClick={() => { haptics.tap(); setOpen(true); }}
          className="flex items-center gap-1 text-[13px] font-semibold text-fg-muted"
        >
          <Pencil size={14} /> {def ? 'Retake' : 'Take quiz'}
        </button>
      </div>

      {def && Icon ? (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-btn bg-accent-soft text-accent grid place-items-center shrink-0">
            <Icon size={22} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold">{def.label}</div>
            <div className="text-xs text-fg-muted leading-snug">{def.blurb}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-fg-muted">Take a quick quiz to tailor Mettle to how you train.</p>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Training style">
        <StyleQuiz onComplete={() => setOpen(false)} />
      </Sheet>
    </Card>
  );
}
