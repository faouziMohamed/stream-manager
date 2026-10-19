import type { ReactNode } from 'react';

export function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <article className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-(--sm-muted)">{title}</h2>
        <span className="inline-flex size-8 items-center justify-center rounded-lg border border-(--sm-border) bg-(--sm-surface2) text-(--sm-gold)">
          {icon}
        </span>
      </div>

      <p className="text-3xl font-semibold tracking-tight text-(--sm-fg)">{value}</p>
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
