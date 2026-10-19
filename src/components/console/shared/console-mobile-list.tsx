import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The phone rendering of a ledger.
 *
 * A table wider than the viewport is not "responsive": it scrolls sideways and
 * takes the status and the actions off-screen, so the reader has to drag the
 * row to find out what it says. Below `md` every list renders these cards with
 * the same facts in the same order; the table comes back at `md`.
 */
export function ConsoleMobileList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('grid gap-3 md:hidden', className)}>{children}</div>;
}

export function ConsoleMobileCard({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-(--sm-border) bg-(--sm-surface) p-4',
        onClick === undefined ? undefined : 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/** Title on the left, the state or the amount on the right. */
export function ConsoleMobileCardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('flex items-start justify-between gap-3', className)}>{children}</div>;
}

/** The row's actions, separated from its facts by a rule. */
export function ConsoleMobileActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mt-3 flex flex-wrap items-center gap-2 border-t border-(--sm-border) pt-3',
        className
      )}
    >
      {children}
    </div>
  );
}

/** One labelled fact, e.g. "Due 10 Jun 2026". */
export function ConsoleMobileFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="shrink-0 text-(--sm-muted)">{label}</span>
      <span className="text-right text-(--sm-fg)">{value}</span>
    </div>
  );
}
