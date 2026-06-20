import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { springPop } from '../../theme/motion';
import { haptics } from '../../lib/haptics';

export function Switch({
  checked,
  onChange,
  'aria-label': ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  'aria-label'?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => {
        haptics.tap();
        onChange(!checked);
      }}
      className={cn(
        'relative w-[46px] h-[28px] rounded-full transition-colors shrink-0 flex items-center px-[3px]',
        checked ? 'bg-accent' : 'bg-border-strong',
      )}
    >
      <motion.span
        layout
        transition={springPop}
        className={cn('block w-[22px] h-[22px] rounded-full bg-white shadow-sm', checked && 'ml-auto')}
      />
    </button>
  );
}
