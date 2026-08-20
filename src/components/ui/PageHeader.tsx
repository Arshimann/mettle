import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  action,
  toolbar,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /**
   * Secondary actions, given their own row beneath the title.
   *
   * More than two buttons can't share the title's row on a phone: the title
   * column collapses, the subtitle ends up squeezed under the buttons, and the
   * last one runs off the edge. Keep the primary action in `action` and put the
   * rest here.
   */
  toolbar?: ReactNode;
}) {
  const heading = (
    <div className="min-w-0">
      <h1 className="text-[26px] leading-tight truncate">{title}</h1>
      {subtitle && <p className="text-sm text-fg-muted mt-1">{subtitle}</p>}
    </div>
  );

  if (toolbar) {
    return (
      <div className="mb-5">
        <div className="flex items-end justify-between gap-3">
          {heading}
          {action && <div className="shrink-0">{action}</div>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">{toolbar}</div>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between gap-3 mb-5">
      {heading}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
