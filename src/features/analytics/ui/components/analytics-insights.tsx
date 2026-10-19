'use client';

import { type AnalyticsDashboardPayload } from '@/features/analytics/ui/queries/use-analytics.queries';
import { formatCurrency } from '@/lib/utils/helpers';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

/**
 * The exact figures behind the revenue chart.
 *
 * This block used to also carry four "insight" cards — overdue count,
 * expiring count, best month, growth — which repeated the metric tiles above
 * and closed each one with advice ("keep the momentum by preventing upcoming
 * expirations…"). The numbers that are not on the tiles are the per-month
 * amounts, and those are what remains.
 */
export function AnalyticsInsights({ revenueSeries }: AnalyticsInsightsProps) {
  const maxRevenue = Math.max(
    ...revenueSeries.map((point) => Number.parseFloat(point.revenue) || 0),
    1
  );

  return (
    <section className="mt-4 rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
      <h2 className="text-sm font-semibold text-(--sm-fg)">Monthly breakdown</h2>
      <p className="mt-1 text-xs text-(--sm-muted)">
        The same months as the chart, with the exact amounts and the change since the month before.
      </p>

      <div className="mt-4 space-y-2">
        {revenueSeries.map((point, index) => {
          const amount = Number.parseFloat(point.revenue) || 0;
          const pct = Math.round((amount / maxRevenue) * 100);

          return (
            <div className="space-y-1" key={point.month}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-(--sm-fg)">{point.label}</p>
                  {index > 0 && (
                    <span
                      className={
                        point.delta >= 0
                          ? 'text-[10px] text-(--sm-emerald) tabular-nums'
                          : 'text-[10px] text-(--sm-coral) tabular-nums'
                      }
                    >
                      {point.delta >= 0 ? '+' : ''}
                      {formatCurrency(point.delta, DEFAULT_CURRENCY)}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-(--sm-fg) tabular-nums">
                  {formatCurrency(amount, DEFAULT_CURRENCY)}
                </p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-(--sm-border)">
                <div className="h-1.5 rounded-full bg-(--sm-coral)" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type RevenuePoint = {
  month: string;
  revenue: string;
  label: string;
  delta: number;
};

type AnalyticsInsightsProps = {
  revenueSeries: RevenuePoint[];
  stats?: AnalyticsDashboardPayload['stats'];
};
