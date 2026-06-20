import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-card bg-surface-2 border border-border grid place-items-center text-fg-subtle mb-4">
        <Icon size={24} strokeWidth={2} />
      </div>
      <h3 className="text-lg mb-1.5">{title}</h3>
      <p className="text-sm text-fg-muted max-w-[16rem] leading-relaxed mb-5">{body}</p>
      {action}
    </div>
  );
}
