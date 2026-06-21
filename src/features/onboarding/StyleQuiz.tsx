import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react';
import { Button } from '../../components/ui';
import { cn } from '../../lib/cn';
import { easeOut } from '../../theme/motion';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { QUIZ, STYLE_DEFS, STYLE_LIST, inferStyle } from '../../data/trainingStyles';
import type { TrainingStyle } from '../../types';

/**
 * Short training-style quiz. Infers a style from a few questions (with a
 * direct-pick override on the result screen), applies its defaults via
 * setTrainingStyle, then calls onComplete. Used in onboarding and the You tab.
 */
export function StyleQuiz({
  onComplete,
  onBack,
}: {
  onComplete: (style: TrainingStyle) => void;
  onBack?: () => void;
}) {
  const setTrainingStyle = useStore((s) => s.setTrainingStyle);

  // step 0..QUIZ.length-1 = questions, QUIZ.length = result
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<TrainingStyle[]>([]);
  const [chosen, setChosen] = useState<TrainingStyle>('all');
  const atResult = step >= QUIZ.length;

  const answer = (style: TrainingStyle) => {
    haptics.select();
    const nextPicks = [...picks.slice(0, step), style];
    setPicks(nextPicks);
    if (step + 1 >= QUIZ.length) {
      setChosen(inferStyle(nextPicks));
      setStep(QUIZ.length);
    } else {
      setStep(step + 1);
    }
  };

  const confirm = () => {
    setTrainingStyle(chosen);
    haptics.success();
    onComplete(chosen);
  };

  if (atResult) {
    const def = STYLE_DEFS[chosen];
    const Icon = def.icon;
    return (
      <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: easeOut }}>
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-[18px] bg-accent text-accent-fg grid place-items-center mx-auto mb-4 shadow-pop">
            <Icon size={30} />
          </div>
          <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-fg-subtle">You train like</div>
          <h2 className="text-3xl mt-1">{def.label}</h2>
          <p className="text-sm text-fg-muted leading-snug mt-1.5 max-w-[20rem] mx-auto">{def.blurb}</p>
        </div>

        <div className="text-[13px] font-semibold text-fg-muted mb-2">Not quite? Pick another:</div>
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {STYLE_LIST.map((s) => {
            const active = s.id === chosen;
            const SIcon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => { haptics.tap(); setChosen(s.id); }}
                className={cn(
                  'relative text-left rounded-card p-3 border-2 bg-surface transition-colors',
                  active ? 'border-accent' : 'border-border',
                )}
              >
                {active && <Check size={15} className="absolute top-2.5 right-2.5 text-accent" />}
                <SIcon size={18} className="text-fg-muted mb-1.5" />
                <div className="font-semibold text-sm">{s.label}</div>
              </button>
            );
          })}
        </div>

        <Button variant="accent" size="lg" fullWidth onClick={confirm}>
          Use this <ArrowRight size={18} />
        </Button>
        <button
          onClick={() => { haptics.tap(); setStep(0); setPicks([]); }}
          className="w-full text-center text-[13px] font-semibold text-fg-muted mt-3 py-1.5"
        >
          Retake quiz
        </button>
      </motion.div>
    );
  }

  const question = QUIZ[step];
  return (
    <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28, ease: easeOut }}>
      <div className="flex items-center gap-1.5 mb-4">
        {QUIZ.map((_, i) => (
          <span key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-accent' : 'w-1.5 bg-border-strong')} />
        ))}
      </div>
      <h2 className="text-2xl mb-5 leading-snug">{question.q}</h2>
      <div className="space-y-2.5">
        {question.options.map((o) => (
          <button
            key={o.label}
            onClick={() => answer(o.style)}
            className="w-full text-left rounded-card p-4 border-2 border-border bg-surface font-semibold transition-colors hover:border-border-strong active:border-accent"
          >
            {o.label}
          </button>
        ))}
      </div>
      {(step > 0 || onBack) && (
        <button
          onClick={() => { haptics.tap(); if (step > 0) setStep(step - 1); else onBack?.(); }}
          className="flex items-center gap-1 text-[13px] font-semibold text-fg-muted mt-4"
        >
          <ChevronLeft size={16} /> Back
        </button>
      )}
    </motion.div>
  );
}
