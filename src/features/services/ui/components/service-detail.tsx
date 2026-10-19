import { ArrowUpRight, CreditCard, ImageIcon, Tv, UsersRound } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { RichTextContent } from '@/components/shared/rich-text/rich-text-content';
import { Badge } from '@/components/ui/badge';
import type { ServiceDetailPayload } from '@/features/services/server/loaders/services.loader';
import { ROUTES } from '@/lib/config/routes';
import { formatCurrency } from '@/lib/utils/helpers';

const CATEGORY_LABELS: Record<string, string> = {
  gaming: 'Gaming',
  music: 'Music streaming',
  other: 'Other service',
  video: 'Video streaming',
};

export function ServiceDetail({ payload }: { payload: ServiceDetailPayload }) {
  const { memberships, membershipsTotal, plans, service, streamingAccounts } = payload;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-(--sm-border) bg-(--sm-bg)">
            {service.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={service.imageUrl} alt={service.name} className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-7 text-(--sm-muted)" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {CATEGORY_LABELS[service.category] ?? service.category}
              </Badge>
              <Badge variant={service.isActive ? 'default' : 'outline'}>
                {service.isActive ? 'Active' : 'Archived'}
              </Badge>
              <Badge variant="secondary">
                {service.supportsProfiles ? 'Profile-level' : 'Account-level'}
              </Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold tracking-wider text-(--sm-muted) uppercase">
                Description
              </p>
              <RichTextContent
                value={service.descriptionContent}
                className="mt-2"
                fallback={
                  <p className="mt-2 text-sm text-(--sm-muted)">No description added yet.</p>
                }
              />
            </div>
          </div>
        </div>
      </section>

      <RelationSection
        icon={<CreditCard className="size-4" />}
        title="Plans"
        count={plans.length}
        href={ROUTES.console.plans}
        actionLabel="Manage plans"
        emptyLabel="No plans reference this service yet."
      >
        {plans.map((plan) => (
          <Row
            key={plan.id}
            title={plan.name}
            subtitle={`${plan.durationMonths} mo · ${plan.planType}`}
          >
            <span className="text-sm font-medium text-(--sm-fg)">
              {formatCurrency(Number(plan.price), plan.currencyCode)}
            </span>
            <Badge variant={plan.isActive ? 'default' : 'outline'}>
              {plan.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </Row>
        ))}
      </RelationSection>

      <RelationSection
        icon={<UsersRound className="size-4" />}
        title="Customers & memberships"
        count={membershipsTotal}
        href={ROUTES.console.memberships}
        actionLabel="All memberships"
        emptyLabel="No memberships use a plan from this service yet."
      >
        {memberships.map((membership) => (
          <Row
            key={membership.id}
            title={membership.businessId}
            subtitle={`${formatDate(membership.startDate)} → ${formatDate(membership.endDate)}`}
          >
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
          </Row>
        ))}
      </RelationSection>

      <RelationSection
        icon={<Tv className="size-4" />}
        title="Streaming accounts"
        count={streamingAccounts.length}
        href={ROUTES.console.streamingAccounts}
        actionLabel="Manage accounts"
        emptyLabel="No streaming accounts are linked to this service yet."
      >
        {streamingAccounts.map((account) => (
          <Row
            key={account.id}
            title={account.label}
            subtitle={account.email ?? `${account.maxProfiles} profiles`}
          >
            {account.supportsProfiles ? <Badge variant="secondary">Profiles</Badge> : null}
            <Badge variant={account.isActive ? 'default' : 'outline'}>
              {account.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </Row>
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

function Row({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-(--sm-fg)">{title}</p>
        <p className="truncate text-xs text-(--sm-muted)">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en');
}
