import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';

function parse(s: string): number | null {
  const n = parseFloat(String(s).replace(',', '.'));
  return isNaN(n) ? null : n;
}

/**
 * Tap-to-select numeric stepper that's still typeable. Empty + a tap accepts the
 * placeholder (e.g. the suggested weight); further taps adjust by `step`.
 */
export function Stepper({
  value,
  onChange,
  step,
  min = 0,
  placeholder,
  decimal = false,
  className,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  step: number;
  min?: number;
  placeholder?: string;
  decimal?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  const fmt = (n: number) =>
    decimal ? (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100)) : String(Math.round(n));

  const adjust = (dir: number) => {
    haptics.tap();
    const cur = parse(value);
    const base = cur != null ? cur : (placeholder != null ? parse(placeholder) : 0) ?? 0;
    const next = cur == null ? base : base + dir * step;
    onChange(fmt(Math.max(min, next)));
  };

  return (
    <div className={cn('flex-1 flex items-center rounded-btn h-11 border bg-surface-2 overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => adjust(-1)}
        className="w-8 h-full grid place-items-center text-fg-muted active:bg-surface shrink-0"
        aria-label={ariaLabel ? `Decrease ${ariaLabel}` : 'Decrease'}
      >
        <Minus size={15} />
      </button>
      <input
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="flex-1 min-w-0 h-full bg-transparent text-center text-[15px] font-bold outline-none"
      />
      <button
        type="button"
        onClick={() => adjust(1)}
        className="w-8 h-full grid place-items-center text-fg-muted active:bg-surface shrink-0"
        aria-label={ariaLabel ? `Increase ${ariaLabel}` : 'Increase'}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
