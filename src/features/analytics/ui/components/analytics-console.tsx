'use client';

import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ReactNode } from 'react';

import { ConsoleMetric } from '@/components/console/shared/console-metric';
import { ConsoleRefreshButton } from '@/components/console/shared/console-refresh-button';
import { AnalyticsInsights } from '@/features/analytics/ui/components/analytics-insights';
import type { AnalyticsDashboardPayload } from '@/features/analytics/ui/queries/use-analytics.queries';
import {
  ANALYTICS_QUERY_KEY,
  useAnalyticsDashboard,
} from '@/features/analytics/ui/queries/use-analytics.queries';
import { CHART_SEMANTIC } from '@/lib/utils/chart-colors';
import {
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
} from '@/lib/utils/chart-tooltip';
import { formatCurrency } from '@/lib/utils/helpers';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

export function AnalyticsConsole({ initialData }: AnalyticsConsoleProps) {
  const { data, isFetching } = useAnalyticsDashboard(initialData);

  const revenueSeries: RevenuePoint[] = data.revenueChart.map((point, index) => {
    const revenue = Number.parseFloat(point.revenue) || 0;
    const previous = index > 0 ? Number.parseFloat(data.revenueChart[index - 1].revenue) || 0 : 0;
    const delta = index === 0 ? 0 : revenue - previous;

    return {
      ...point,
      delta,
      deltaLabel:
        delta >= 0
          ? `+${formatCurrency(delta, DEFAULT_CURRENCY)}`
          : formatCurrency(delta, DEFAULT_CURRENCY),
      label: formatMonth(point.month),
    };
  });

  const revenues = revenueSeries.map((p) => Number.parseFloat(p.revenue) || 0);
  const latestRevenue = revenues.at(-1) ?? 0;
  const previousRevenue = revenues.at(-2) ?? 0;

  const trendPct =
    previousRevenue === 0
      ? null
      : Math.round(((latestRevenue - previousRevenue) / previousRevenue) * 100);
  const trendSign = trendPct !== null && trendPct >= 0 ? '+' : '';
  const trendLabel = trendPct === null ? undefined : `${trendSign}${trendPct}% vs prev`;

  const monthlyRevenueSeries = revenueSeries.map((p) => ({
    label: p.label,
    revenue: Number.parseFloat(p.revenue) || 0,
  }));
  const deltaSeries = revenueSeries.map((p) => ({ label: p.label, delta: p.delta }));

  return (
    <section className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-(--sm-muted)">
          <BarChart3 className="size-3.5" />
          {data.revenueChart.length} monthly points ·{' '}
          {isFetching ? 'Refreshing…' : 'Updated just now'}
        </div>
        <ConsoleRefreshButton ariaLabel="Refresh analytics" queryKey={ANALYTICS_QUERY_KEY} />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <ConsoleMetric
          label="Monthly revenue"
          value={formatCurrency(data.stats.monthlyRevenue, DEFAULT_CURRENCY)}
          description={trendLabel}
        />
        <ConsoleMetric
          label="Active memberships"
          tone="positive"
          value={String(data.stats.activeMemberships)}
        />
        <ConsoleMetric
          label="Overdue payments"
          tone="critical"
          value={String(data.stats.overdueCount)}
          description={data.stats.overdueCount > 0 ? 'Action required' : 'All clear'}
        />
        <ConsoleMetric
          label="Expiring in 7 days"
          tone="caution"
          value={String(data.stats.expiringCount)}
          description={data.stats.expiringCount > 0 ? 'Renewal window open' : 'Nothing due soon'}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <ChartPanel
          title="Revenue trend"
          description="Monthly booked revenue over time. Flat periods indicate stable retention; spikes usually trace to new member batches or plan upgrades."
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyRevenueSeries}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatCurrency(Number(v), DEFAULT_CURRENCY)}
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v), DEFAULT_CURRENCY), 'Revenue']}
                contentStyle={CHART_TOOLTIP_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={CHART_SEMANTIC.revenue}
                strokeWidth={2.5}
                dot={{ r: 3, fill: CHART_SEMANTIC.revenue }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Month-to-month change"
          description="Green bars = growth vs the prior month. Red bars show months where revenue contracted — isolate what changed in those periods."
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deltaSeries}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatCurrency(Number(v), DEFAULT_CURRENCY)}
              />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v), DEFAULT_CURRENCY), 'Change']}
                contentStyle={CHART_TOOLTIP_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              />
              <Bar dataKey="delta" radius={[3, 3, 0, 0]}>
                {deltaSeries.map((p) => (
                  <Cell
                    key={p.label}
                    fill={p.delta >= 0 ? CHART_SEMANTIC.paid : CHART_SEMANTIC.overdue}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <AnalyticsInsights revenueSeries={revenueSeries} />
    </section>
  );
}

type AnalyticsConsoleProps = {
  initialData: AnalyticsDashboardPayload;
};

type RevenuePoint = AnalyticsDashboardPayload['revenueChart'][number] & {
  delta: number;
  deltaLabel: string;
  label: string;
};

function ChartPanel({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <article className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
      <h2 className="text-sm font-semibold text-(--sm-fg)">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-(--sm-muted)">{description}</p>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function formatMonth(month: string): string {
  const [year, monthPart] = month.split('-');
  if (!year || !monthPart) return month;
  const date = new Date(Number(year), Number(monthPart) - 1, 1);
  return date.toLocaleDateString('en', { month: 'short', year: '2-digit' });
}
