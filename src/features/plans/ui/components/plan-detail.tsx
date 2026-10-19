import { ArrowUpRight, Building2, UsersRound } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { RichTextContent } from '@/components/shared/rich-text/rich-text-content';
import { Badge } from '@/components/ui/badge';
import type { PlanDetailPayload } from '@/features/plans/server/loaders/plans.loader';
import { ROUTES } from '@/lib/config/routes';
import { formatCurrency } from '@/lib/utils/helpers';

const PLAN_TYPE_LABELS: Record<string, string> = {
  family: 'Family',
  individual: 'Individual',
  shared: 'Shared',
};

export function PlanDetail({ payload }: { payload: PlanDetailPayload }) {
  const { memberships, membershipsTotal, owner, plan } = payload;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{PLAN_TYPE_LABELS[plan.planType] ?? plan.planType}</Badge>
          <Badge variant={plan.isActive ? 'default' : 'outline'}>
            {plan.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <span className="text-sm font-semibold text-(--sm-fg)">
            {formatCurrency(Number(plan.price), plan.currencyCode)}
          </span>
          <span className="text-sm text-(--sm-muted)">
            · {plan.durationMonths} {plan.durationMonths === 1 ? 'month' : 'months'}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold tracking-wider text-(--sm-muted) uppercase">
            Description
          </p>
          <RichTextContent
            value={plan.descriptionContent}
            preset="compact"
            className="mt-2"
            fallback={<p className="mt-2 text-sm text-(--sm-muted)">No description added yet.</p>}
          />
        </div>
      </section>

      <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface)">
        <div className="flex items-center gap-2 border-b border-(--sm-border) px-5 py-3.5">
          <span className="inline-flex size-7 items-center justify-center rounded-lg border border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral-t)">
            <Building2 className="size-4" />
          </span>
          <p className="text-sm font-semibold text-(--sm-fg)">Belongs to</p>
        </div>
        {owner === null ? (
          <p className="px-5 py-6 text-center text-xs text-(--sm-muted)">No owner linked.</p>
        ) : (
          <Link
            href={owner.href}
            className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-(--sm-bg)"
          >
            <div>
              <p className="text-sm font-medium text-(--sm-fg)">{owner.name}</p>
              <p className="text-xs text-(--sm-muted) capitalize">{owner.type}</p>
            </div>
            <ArrowUpRight className="size-4 text-(--sm-coral)" />
          </Link>
        )}
      </section>

      <RelationSection
        icon={<UsersRound className="size-4" />}
        title="Customers & memberships"
        count={membershipsTotal}
        href={ROUTES.console.memberships}
        actionLabel="All memberships"
        emptyLabel="No memberships use this plan yet."
      >
        {memberships.map((membership) => (
          <div
            key={membership.id}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-(--sm-fg)">{membership.businessId}</p>
              <p className="truncate text-xs text-(--sm-muted)">
                {formatDate(membership.startDate)} → {formatDate(membership.endDate)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{membership.status}</Badge>
              <Link
                href={ROUTES.console.customerDetail(membership.customerId)}
                className="inline-flex items-center gap-1 text-xs text-(--sm-coral) hover:underline"
              >
                Customer <ArrowUpRight className="size-3" />
              </Link>
              <Link
                href={ROUTES.console.membershipDetail(membership.id)}
                className="inline-flex items-center gap-1 text-xs text-(--sm-coral) hover:underline"
              >
                Membership <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>
        ))}
      </RelationSection>
    </div>
  );
}

function RelationSection({
  icon,
  title,
  count,
  href,
  actionLabel,
  emptyLabel,
  children,
}: {
  icon: ReactNode;
  title: string;
  count: number;
  href: string;
  actionLabel: string;
  emptyLabel: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const isEmpty = items.flat().filter(Boolean).length === 0;

  return (
    <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface)">
      <div className="flex items-center justify-between border-b border-(--sm-border) px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg border border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral-t)">
            {icon}
          </span>
          <p className="text-sm font-semibold text-(--sm-fg)">{title}</p>
          <span className="rounded-full bg-(--sm-surface2) px-2 py-0.5 text-[10px] font-semibold text-(--sm-muted)">
            {count}
          </span>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-medium text-(--sm-coral) hover:underline"
        >
          {actionLabel} <ArrowUpRight className="size-3" />
        </Link>
      </div>
      <div className="divide-y divide-(--sm-border)">
        {isEmpty ? (
          <p className="px-5 py-6 text-center text-xs text-(--sm-muted)">{emptyLabel}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en');
}
