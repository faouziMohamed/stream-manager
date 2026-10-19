'use client';

import { Activity } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import type { MembershipTrendPoint } from '@/features/memberships/shared/membership-trend.mapper';
import { CHART_SEMANTIC } from '@/lib/utils/chart-colors';
import {
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
} from '@/lib/utils/chart-tooltip';

/**
 * How the book of subscriptions moved, month by month.
 *
 * A line per state rather than one stacked area: the three measure different
 * things — `Active` is a running total of subscriptions in force, while
 * `Cancelled` and `Unpaid renewal` are events in the month they happened.
 * Stacking them would add a running total to two event counts and produce a
 * number that means nothing.
 *
 * A renewal is the same subscription, and a recurring one stays active until
 * cancelled; when its term ends unpaid the subscription is still in force and
 * the lapse appears on the unpaid line, not as a dead subscription.
 */
export function MembershipTrendChart({ series }: MembershipTrendChartProps) {
  if (series.length === 0) {
    return (
      <ConsoleEmptyState
        description="The trend appears once subscriptions exist."
        icon={<Activity className="size-4" />}
        title="No subscription history yet"
      />
    );
  }

  const peak = series.reduce((best, point) => Math.max(best, point.active), 0);

  return (
    <section className="mt-6 rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
      <header className="mb-4">
        <h3 className="text-sm font-semibold text-(--sm-fg)">Subscription trend</h3>
        <p className="text-xs text-(--sm-muted)">
          Active subscriptions per month, against cancellations and renewals left unpaid · peak{' '}
          {peak}
        </p>
      </header>

      <ResponsiveContainer height={260} width="100%">
        <LineChart data={series}>
          <CartesianGrid className="stroke-border" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            cursor={{ stroke: 'var(--sm-border2)' }}
            itemStyle={CHART_TOOLTIP_ITEM_STYLE}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          <Line
            dataKey="active"
            dot={{ r: 2 }}
            name="Active"
            stroke={CHART_SEMANTIC.paid}
            strokeWidth={2.5}
            type="monotone"
          />
          <Line
            dataKey="cancelled"
            dot={{ r: 2 }}
            name="Cancelled"
            stroke={CHART_SEMANTIC.overdue}
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="unpaid"
            dot={{ r: 2 }}
            name="Unpaid renewal"
            stroke={CHART_SEMANTIC.unpaid}
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}

type MembershipTrendChartProps = {
  series: MembershipTrendPoint[];
};
