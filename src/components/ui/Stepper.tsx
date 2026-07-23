import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/cn';
import { haptics } from '../../lib/haptics';

function parse(s: string): number | null {
  const n = parseFloat(String(s).replace(',', '.'));
  return isNaN(n) ? null : n;
}

/** Sanitize typed input: digits only (plus one decimal point when allowed),
 *  at most 4 integer digits, clamped to `max`. Empty stays empty so the
 *  placeholder-accept flow keeps working. */
function sanitize(raw: string, decimal: boolean, max: number): string {
  let s = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  if (!decimal) {
    s = s.replace(/\./g, '');
  } else {
    // Keep only the first decimal point.
    const i = s.indexOf('.');
    if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');
  }
  const [int = '', frac] = s.split('.');
  const intPart = int.slice(0, 4);
  let out = frac !== undefined ? `${intPart}.${frac.slice(0, 2)}` : intPart;
  const n = parse(out);
  if (n != null && n > max) out = String(max);
  return out;
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
  max = 9999,
  placeholder,
  decimal = false,
  className,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  step: number;
  min?: number;
  max?: number;
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
    onChange(fmt(Math.min(max, Math.max(min, next))));
  };

  return (
    <div className={cn('flex-1 flex items-center rounded-btn h-12 border bg-surface-2 overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => adjust(-1)}
        className="w-10 h-full grid place-items-center text-fg-muted active:bg-surface-3 shrink-0"
        aria-label={ariaLabel ? `Decrease ${ariaLabel}` : 'Decrease'}
      >
        <Minus size={16} />
      </button>
      <input
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={value}
        onChange={(e) => onChange(sanitize(e.target.value, decimal, max))}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="flex-1 min-w-0 h-full bg-transparent text-center text-[17px] font-bold tabular outline-none"
      />
      <button
        type="button"
        onClick={() => adjust(1)}
        className="w-10 h-full grid place-items-center text-fg-muted active:bg-surface-3 shrink-0"
        aria-label={ariaLabel ? `Increase ${ariaLabel}` : 'Increase'}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
