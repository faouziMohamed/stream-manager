import { AlertTriangle, ChartBar, Clock3, Wallet } from 'lucide-react';

import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { StatsCard } from '@/components/console/shared/stats-card';
import { loadDashboardStats } from '@/features/analytics/server/loaders/analytics.loader';
import { ROUTES } from '@/lib/config/routes';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

export default async function ConsolePage() {
  const stats = await loadDashboardStats();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Console"
        description="See memberships, revenue, and urgent signals across your streaming operation at a glance."
      />

      <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatsCard
          title="Active memberships"
          value={String(stats.activeMemberships)}
          description="Currently active plans"
          icon={<ChartBar className="size-4 text-(--sm-muted)" />}
        />
        <StatsCard
          title="Monthly revenue"
          value={formatCurrency(stats.monthlyRevenue, DEFAULT_CURRENCY)}
          description="Current month total"
          icon={<Wallet className="size-4 text-(--sm-muted)" />}
        />
        <StatsCard
          title="Overdue payments"
          value={String(stats.overdueCount)}
          description="Pending collection"
          icon={<AlertTriangle className="size-4 text-(--sm-muted)" />}
        />
        <StatsCard
          title="Expiring soon"
          value={String(stats.expiringCount)}
          description="Memberships nearing end date"
          icon={<Clock3 className="size-4 text-(--sm-muted)" />}
        />
      </section>

      <section className="mt-6 rounded-xl border border-(--sm-border) bg-(--sm-surface) p-6">
        <h2 className="text-sm font-semibold text-(--sm-fg)">Current status</h2>
        <p className="mt-2 text-sm leading-6 text-(--sm-muted)">
          You are viewing the protected dashboard entry page at <code>{ROUTES.console.root}</code>.
        </p>
      </section>
    </main>
  );
}
