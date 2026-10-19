import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ConsoleMetric } from '@/components/console/shared/console-metric';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { buttonVariants } from '@/components/ui/button';
import { loadStreamingAccounts } from '@/features/streaming-accounts/server/loaders/streaming-accounts.loader';
import { buildStreamingAccountStats } from '@/features/streaming-accounts/shared/streaming-account-stats.mapper';
import { StreamingAccountAssignments } from '@/features/streaming-accounts/ui/components/streaming-account-assignments';
import { StreamingAccountsConsole } from '@/features/streaming-accounts/ui/components/streaming-accounts-console';
import { isCurrentUserAdmin } from '@/lib/auth/current-user';
import { ROUTES } from '@/lib/config/routes';
import { cn, formatCurrency } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

/**
 * One streaming account as a record: what it earns, who holds its profiles,
 * and every control for configuring it. The inventory card is the way in.
 */
export default async function StreamingAccountDetailPage({
  params,
}: StreamingAccountDetailPageProps) {
  const { id } = await params;
  const [data, canManage] = await Promise.all([loadStreamingAccounts(), isCurrentUserAdmin()]);
  const account = data.items.find((item) => item.id === id);

  if (account === undefined) notFound();

  const serviceName =
    data.serviceOptions.find((service) => service.id === account.serviceId)?.name ??
    'Unknown service';
  const stats = buildStreamingAccountStats({
    maxProfiles: account.maxProfiles,
    membershipsById: new Map(
      data.membershipOptions.map((membership) => [membership.id, membership])
    ),
    profiles: account.profiles ?? [],
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <Link
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-2 text-(--sm-muted) hover:text-(--sm-fg)'
          )}
          href={ROUTES.console.streamingAccounts}
        >
          <ArrowLeft className="size-4" />
          Streaming accounts
        </Link>
      </div>

      <header className="mb-8 border-b border-(--sm-border) pb-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="sm-title text-3xl font-semibold tracking-tight">{account.label}</h1>
          <StatusBadge tone={account.isActive ? 'positive' : 'neutral'}>
            {account.isActive ? 'Active' : 'Inactive'}
          </StatusBadge>
        </div>
        <p className="sm-subtitle mt-2 text-sm">
          {serviceName}
          {account.email === null ? '' : ` · ${account.email}`} ·{' '}
          {account.supportsProfiles ? 'profiles on' : 'single profile'}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <ConsoleMetric
          description={`of ${stats.capacity} profile${stats.capacity === 1 ? '' : 's'}`}
          label="Assigned"
          tone={stats.free === 0 ? 'critical' : 'positive'}
          value={String(stats.assigned)}
        />
        <ConsoleMetric
          description={stats.free === 0 ? 'the account is full' : 'ready to sell'}
          label="Free slots"
          tone={stats.free === 0 ? 'critical' : 'caution'}
          value={String(stats.free)}
        />
        <ConsoleMetric
          description={
            stats.payingCount === 0
              ? 'no holder is covered today'
              : `from ${stats.payingCount} paid holder${stats.payingCount === 1 ? '' : 's'}`
          }
          label="Per month"
          value={formatCurrency(stats.monthlyRevenue, stats.currencyCode ?? DEFAULT_CURRENCY)}
        />
        <ConsoleMetric
          description={stats.nextToFree?.customerName ?? 'no dated holder'}
          label="Next slot free"
          tone={stats.nextToFree === null ? 'neutral' : 'caution'}
          value={
            stats.nextToFree?.endDate === undefined
              ? '—'
              : formatDisplayDate(stats.nextToFree.endDate) || stats.nextToFree.endDate
          }
        />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-(--sm-fg)">Who holds a profile</h2>
        <p className="mt-1 mb-4 text-xs text-(--sm-muted)">
          Each assignment, the membership behind it, and how far its cover is paid.
        </p>
        <StreamingAccountAssignments holders={stats.holders} />
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-(--sm-fg)">Configuration</h2>
        <p className="mt-1 text-xs text-(--sm-muted)">
          Rename the account, add or remove profile slots, and assign them to memberships.
        </p>
        <StreamingAccountsConsole
          canManage={canManage}
          focusAccountId={account.id}
          initialData={{ items: data.items, total: data.total }}
          membershipOptions={data.membershipOptions}
          serviceOptions={data.serviceOptions}
        />
      </section>
    </main>
  );
}

type StreamingAccountDetailPageProps = {
  params: Promise<{ id: string }>;
};
