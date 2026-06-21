import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { haptics } from '../../lib/haptics';
import { playChime } from '../../lib/sound';
import { useStore } from '../../store/useStore';

export function RestTimer() {
  const session = useStore((s) => s.activeSession);
  const update = useStore((s) => s.updateSession);
  const restChime = useStore((s) => s.settings.restChime);
  const [now, setNow] = useState(() => Date.now());

  const endsAt = session?.restEndsAt ?? null;

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [endsAt]);

  useEffect(() => {
    if (endsAt && now >= endsAt) {
      if (restChime) playChime();
      haptics.success();
      update((s) => ({ ...s, restEndsAt: null, restDuration: null }));
    }
  }, [now, endsAt, restChime, update]);

  if (!session || !endsAt) return null;

  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const total = session.restDuration || 1;
  const pct = Math.max(0, Math.min(1, (endsAt - now) / (total * 1000)));
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-32px)] max-w-[420px]"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
    >
      <div className="bg-elevated border border-border rounded-card shadow-pop px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-subtle">Rest</span>
          <span className="text-xl font-bold tabular">
            {mm}:{ss}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                haptics.tap();
                update((s) => ({
                  ...s,
                  restEndsAt: (s.restEndsAt ?? Date.now()) + 15000,
                  restDuration: (s.restDuration ?? 0) + 15,
                }));
              }}
              className="flex items-center h-8 px-2.5 rounded-btn bg-surface-2 text-fg text-[13px] font-semibold"
            >
              <Plus size={14} />
              15s
            </button>
            <button
              onClick={() => {
                haptics.tap();
                update((s) => ({ ...s, restEndsAt: null, restDuration: null }));
              }}
              className="w-8 h-8 grid place-items-center rounded-btn bg-surface-2 text-fg-muted"
              aria-label="Skip rest"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct * 100}%` }} />
        </div>
      </div>
    </motion.div>
  );
}
