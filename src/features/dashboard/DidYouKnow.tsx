import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Card, CardLabel } from '../../components/ui';
import { easeOut } from '../../theme/motion';
import { haptics } from '../../lib/haptics';
import { FACTS } from '../../data/facts';

// Computed once at module load (impure call kept out of render).
const TODAY_INDEX = Math.floor(Date.now() / 86400000) % FACTS.length;

export function DidYouKnow() {
  const [i, setI] = useState(TODAY_INDEX);
  const [spin, setSpin] = useState(false);
  const f = FACTS[i];

  const next = () => {
    haptics.tap();
    setSpin(true);
    setI((p) => (p + 1) % FACTS.length);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-accent">
          <Lightbulb size={15} />
          <CardLabel className="mb-0 text-accent">Did you know</CardLabel>
        </div>
        <motion.button
          onClick={next}
          className="text-fg-subtle"
          aria-label="Another fact"
          animate={{ rotate: spin ? 360 : 0 }}
          transition={{ duration: 0.4, ease: easeOut }}
          onAnimationComplete={() => setSpin(false)}
        >
          <RefreshCw size={15} />
        </motion.button>
      </div>
      {/* Re-key on the fact index so each new fact fades/slides in cleanly. */}
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easeOut }}
      >
        <h3 className="text-base font-semibold mb-1">{f.title}</h3>
        <p className="text-sm text-fg-muted leading-relaxed">{f.body}</p>
      </motion.div>
    </Card>
  );
}
