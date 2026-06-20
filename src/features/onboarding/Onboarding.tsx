import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../config';
import { Button, Segmented } from '../../components/ui';
import { cn } from '../../lib/cn';
import { easeOut } from '../../theme/motion';
import { haptics } from '../../lib/haptics';
import { useStore } from '../../store/useStore';
import { ThemePicker } from '../settings/ThemePicker';
import { TEMPLATES } from '../../data/templates';

const STEPS = ['welcome', 'theme', 'units', 'template'] as const;

export function Onboarding() {
  const units = useStore((s) => s.settings.units);
  const setUnits = useStore((s) => s.setUnits);
  const applyTemplate = useStore((s) => s.applyTemplate);
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    haptics.tap();
  };

  const finish = () => {
    if (templateId) {
      const t = TEMPLATES.find((x) => x.id === templateId);
      if (t) applyTemplate(t.days);
    }
    haptics.success();
    completeOnboarding();
  };

  const key = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col">
      {/* progress dots */}
      <div
        className="flex items-center justify-center gap-1.5 pt-6"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
      >
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === step ? 'w-6 bg-accent' : 'w-1.5 bg-border-strong',
            )}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6">
        <div className="max-w-[460px] mx-auto min-h-full flex flex-col justify-center py-8">
            <motion.div
              key={key}
              initial={{ opacity: 0, x: dir * 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: easeOut }}
            >
              {key === 'welcome' && (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-[18px] bg-accent text-accent-fg grid place-items-center font-black text-3xl mx-auto mb-6 shadow-pop">
                    {APP_NAME[0]}
                  </div>
                  <h1 className="text-4xl mb-3">{APP_NAME}</h1>
                  <p className="text-lg text-fg-muted leading-snug max-w-[20rem] mx-auto">
                    {APP_TAGLINE} Build your split, log every set, and watch the numbers climb.
                  </p>
                </div>
              )}

              {key === 'theme' && (
                <div>
                  <h1 className="text-3xl mb-1.5">Pick your look</h1>
                  <p className="text-fg-muted mb-6">Change it anytime in settings.</p>
                  <ThemePicker />
                </div>
              )}

              {key === 'units' && (
                <div>
                  <h1 className="text-3xl mb-1.5">Pounds or kilos?</h1>
                  <p className="text-fg-muted mb-6">How you'd like to enter and see weight.</p>
                  <Segmented
                    fullWidth
                    value={units}
                    onChange={setUnits}
                    options={[
                      { value: 'kg', label: 'Kilograms (kg)' },
                      { value: 'lbs', label: 'Pounds (lbs)' },
                    ]}
                  />
                </div>
              )}

              {key === 'template' && (
                <div>
                  <h1 className="text-3xl mb-1.5">Choose a starting point</h1>
                  <p className="text-fg-muted mb-6">Use a proven split or start from scratch.</p>
                  <div className="space-y-2.5">
                    {TEMPLATES.map((t) => {
                      const active = templateId === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            haptics.select();
                            setTemplateId(t.id);
                          }}
                          className={cn(
                            'w-full text-left rounded-card p-4 border-2 transition-colors bg-surface',
                            active ? 'border-accent' : 'border-border',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{t.name}</span>
                            <span className="text-[11px] font-semibold text-fg-subtle">{t.cadence}</span>
                          </div>
                          <p className="text-sm text-fg-muted mt-1 leading-snug">{t.desc}</p>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        haptics.select();
                        setTemplateId(null);
                      }}
                      className={cn(
                        'w-full text-left rounded-card p-4 border-2 transition-colors bg-surface flex items-center justify-between',
                        templateId === null ? 'border-accent' : 'border-border',
                      )}
                    >
                      <span className="font-semibold">Start from scratch</span>
                      {templateId === null && <Check size={18} className="text-accent" />}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
        </div>
      </div>

      {/* nav bar */}
      <div
        className="px-6 pb-8 pt-3 flex items-center gap-3 max-w-[460px] mx-auto w-full"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
      >
        {step > 0 && (
          <Button variant="ghost" onClick={() => go(step - 1)} aria-label="Back">
            <ChevronLeft size={20} />
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button variant="accent" size="lg" fullWidth onClick={() => go(step + 1)}>
            Continue <ArrowRight size={18} />
          </Button>
        ) : (
          <Button variant="accent" size="lg" fullWidth onClick={finish}>
            {templateId ? 'Start training' : 'Finish setup'} <ArrowRight size={18} />
          </Button>
        )}
      </div>
    </div>
  );
}
