'use client';

import { TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import type { PaymentHistoryPoint } from '@/features/customers/shared/customer-hub.mapper';
import { CHART_SEMANTIC } from '@/lib/utils/chart-colors';
import {
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
} from '@/lib/utils/chart-tooltip';
import { formatCurrency } from '@/lib/utils/helpers';

/**
 * One customer's billing history, month by month.
 *
 * Stacked bars rather than a line: the quantity is money billed in a discrete
 * month, not a continuous measure, and stacking shows the split between what
 * was settled and what is still owed in the same column. A customer with three
 * payments would make a line chart imply a trend that is not there.
 */
export function CustomerPaymentHistory({ currencyCode, series }: CustomerPaymentHistoryProps) {
  if (series.length === 0) {
    return (
      <ConsoleEmptyState
        description="Payments will chart here once this customer has been billed."
        icon={<TrendingUp className="size-4" />}
        title="No billing history yet"
      />
    );
  }

  const totalPaid = series.reduce((sum, point) => sum + point.paid, 0);
  const totalOutstanding = series.reduce((sum, point) => sum + point.outstanding, 0);

  return (
    <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-(--sm-fg)">Billing history</h3>
          <p className="text-xs text-(--sm-muted)">
            {series.length} month{series.length === 1 ? '' : 's'} ·{' '}
            {formatCurrency(totalPaid, currencyCode)} settled
            {totalOutstanding > 0
              ? ` · ${formatCurrency(totalOutstanding, currencyCode)} outstanding`
              : null}
          </p>
        </div>
      </header>

      <ResponsiveContainer height={240} width="100%">
        <BarChart data={series}>
          <CartesianGrid className="stroke-border" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => formatCurrency(Number(value), currencyCode)}
            width={88}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            cursor={{ fill: 'var(--sm-hover)' }}
            formatter={(value, name) => [formatCurrency(Number(value), currencyCode), name]}
            itemStyle={CHART_TOOLTIP_ITEM_STYLE}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          <Bar
            dataKey="paid"
            fill={CHART_SEMANTIC.paid}
            name="Paid"
            radius={[3, 3, 0, 0]}
            stackId="amount"
          />
          <Bar
            dataKey="outstanding"
            fill={CHART_SEMANTIC.unpaid}
            name="Outstanding"
            radius={[3, 3, 0, 0]}
            stackId="amount"
          />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

type CustomerPaymentHistoryProps = {
  currencyCode: string;
  series: PaymentHistoryPoint[];
};
