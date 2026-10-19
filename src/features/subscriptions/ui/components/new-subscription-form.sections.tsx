'use client';

import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { SubscriptionPlanOption } from '@/features/subscriptions/server/loaders/subscription-form.loader';
import { formatDisplayDate } from '@/lib/utils/iso-date';

export function Section({ action, children, icon, subtitle, title }: SectionProps) {
  return (
    <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-(--sm-border) bg-(--sm-bg) text-(--sm-coral)">
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-(--sm-fg)">{title}</p>
            <p className="text-xs text-(--sm-muted)">{subtitle}</p>
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Restates the term and the money, so the operator confirms before saving. */
export function SummaryRow({ endDate, plan }: SummaryRowProps) {
  if (plan === null || endDate === null) {
    return (
      <p className="mt-4 rounded-lg border border-dashed border-(--sm-border) px-3 py-2.5 text-xs text-(--sm-muted)">
        Pick a plan to see the term and the amount.
      </p>
    );
  }

  return (
    <dl className="mt-4 grid gap-px overflow-hidden rounded-lg border border-(--sm-border) bg-(--sm-border) sm:grid-cols-2">
      <div className="bg-(--sm-bg) px-3 py-2.5">
        <dt className="text-[11px] font-medium tracking-wide text-(--sm-muted) uppercase">Term</dt>
        <dd className="mt-0.5 text-sm text-(--sm-fg)">
          {plan.durationMonths} month{plan.durationMonths === 1 ? '' : 's'} · ends{' '}
          {formatDisplayDate(endDate, 'long')}
        </dd>
      </div>
      <div className="bg-(--sm-bg) px-3 py-2.5">
        <dt className="text-[11px] font-medium tracking-wide text-(--sm-muted) uppercase">
          Amount
        </dt>
        <dd className="mt-0.5 text-sm font-semibold text-(--sm-fg)">
          {plan.price} {plan.currencyCode}
        </dd>
      </div>
    </dl>
  );
}

export function ToggleRow({ checked, description, icon, label, onCheckedChange }: ToggleRowProps) {
  return (
    <Label className="flex items-start gap-3 rounded-lg border border-(--sm-border) bg-(--sm-bg) px-3 py-2.5">
      <Switch checked={checked} className="mt-0.5" onCheckedChange={onCheckedChange} />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium text-(--sm-fg)">
          {icon}
          {label}
        </span>
        <span className="mt-0.5 block text-xs font-normal text-(--sm-muted)">{description}</span>
      </span>
    </Label>
  );
}

type SectionProps = {
  action?: ReactNode;
  children: ReactNode;
  icon: ReactNode;
  subtitle: string;
  title: string;
};

type SummaryRowProps = {
  endDate: string | null;
  plan: SubscriptionPlanOption | null;
};

type ToggleRowProps = {
  checked: boolean;
  description: string;
  icon: ReactNode;
  label: string;
  onCheckedChange: (checked: boolean) => void;
};
