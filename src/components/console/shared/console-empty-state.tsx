import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function ConsoleEmptyState({
  bordered = true,
  description,
  icon,
  title,
  className,
}: ConsoleEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-10 text-center',
        bordered ? 'rounded-lg border border-dashed border-(--sm-border)' : '',
        className
      )}
    >
      {icon === undefined ? null : (
        <span className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-(--sm-surface2) text-(--sm-muted)">
          {icon}
        </span>
      )}
      <p className="text-sm font-medium text-(--sm-fg)">{title}</p>
      {description === undefined ? null : (
        <p className="mt-1 text-xs text-(--sm-muted)">{description}</p>
      )}
    </div>
  );
}

type ConsoleEmptyStateProps = {
  bordered?: boolean;
  className?: string;
  description?: string;
  icon?: ReactNode;
  title: string;
};
