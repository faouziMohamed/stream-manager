import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { ConsoleRefreshButton } from '@/components/console/shared/console-refresh-button';
import { loadRevenueChart } from '@/features/analytics/server/loaders/revenue-chart.loader';
import { loadDashboardStats } from '@/features/analytics/server/loaders/analytics.loader';
import { AnalyticsConsole } from '@/features/analytics/ui/components/analytics-console';
import { ANALYTICS_QUERY_KEY } from '@/features/analytics/ui/queries/use-analytics.queries';

export default async function AnalyticsPage() {
  const [stats, revenueChart] = await Promise.all([loadDashboardStats(), loadRevenueChart()]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Analytics"
        description="Inspect monthly revenue, payment behavior, and the signals shaping your streaming operation."
        actions={
          <ConsoleRefreshButton ariaLabel="Refresh analytics" queryKey={ANALYTICS_QUERY_KEY} />
        }
      />
      <AnalyticsConsole initialData={{ revenueChart, stats }} />
    </main>
  );
}
