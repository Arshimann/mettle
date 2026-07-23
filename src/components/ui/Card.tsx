import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('bg-surface card-sheen border border-border rounded-card shadow-card p-5', className)}
      {...rest}
    />
  ),
);
Card.displayName = 'Card';

/** Small uppercase label used at the top of cards/sections. */
export function CardLabel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle mb-1.5',
        className,
      )}
      {...rest}
    />
  );
}
