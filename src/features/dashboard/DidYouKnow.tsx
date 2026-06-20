import { useState } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Card, CardLabel } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { FACTS } from '../../data/facts';

// Computed once at module load (impure call kept out of render).
const TODAY_INDEX = Math.floor(Date.now() / 86400000) % FACTS.length;

export function DidYouKnow() {
  const [i, setI] = useState(TODAY_INDEX);
  const f = FACTS[i];
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-accent">
          <Lightbulb size={15} />
          <CardLabel className="mb-0 text-accent">Did you know</CardLabel>
        </div>
        <button
          onClick={() => { haptics.tap(); setI((p) => (p + 1) % FACTS.length); }}
          className="text-fg-subtle"
          aria-label="Another fact"
        >
          <RefreshCw size={15} />
        </button>
      </div>
      <h3 className="text-base font-semibold mb-1">{f.title}</h3>
      <p className="text-sm text-fg-muted leading-relaxed">{f.body}</p>
    </Card>
  );
}
