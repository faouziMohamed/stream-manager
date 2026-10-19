import type { ReactNode } from 'react';

// `min-w-0` lets the card shrink inside a two-column grid; without it a long
// currency value sets the track's minimum and the page scrolls sideways.
// `overflow-wrap:anywhere` breaks "MAD 450.00" — the space Intl emits is
// non-breaking — only when it would overflow.
export function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <article className="min-w-0 rounded-xl border border-(--sm-border) bg-(--sm-surface) p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="min-w-0 text-sm font-medium text-(--sm-muted)">{title}</h2>
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-(--sm-border) bg-(--sm-surface2) text-(--sm-gold)">
          {icon}
        </span>
      </div>

      <p className="text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] text-(--sm-fg) tabular-nums sm:text-3xl">
        {value}
      </p>
      {description === undefined ? null : (
        <p className="mt-2 text-xs text-(--sm-muted)">{description}</p>
      )}
    </article>
  );
}

type StatsCardProps = {
  title: string;
  value: string;
  description?: string;
  icon?: ReactNode;
};
