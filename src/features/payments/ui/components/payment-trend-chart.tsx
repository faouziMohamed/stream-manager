'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import { Button } from '@/components/ui/button';
import {
  buildAgingBuckets,
  buildPaymentTrend,
  type PaymentTrendItem,
} from '@/features/payments/shared/payment-trend.mapper';
import { CHART_SEMANTIC } from '@/lib/utils/chart-colors';
import {
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
} from '@/lib/utils/chart-tooltip';
import { formatCurrency } from '@/lib/utils';

/**
 * How collection is moving, and what is still owed.
 *
 * The two lines are independent series on one time axis, never stacked: a
 * payment billed in June and settled in August appears in `Due` for June and
 * `Collected` for August, so adding them would count it twice. The gap
 * between the lines in a month is that month's shortfall.
 */
const WINDOW_MONTHS = 12;

export function PaymentTrendChart({ currencyCode, payments }: PaymentTrendChartProps) {
  const series = buildPaymentTrend(payments);
  const aging = buildAgingBuckets(payments);
  const outstanding = aging.reduce((total, bucket) => total + bucket.amount, 0);

  // A year at a time, with the arrows stepping back through history. A ledger
  // that has run for years should not squeeze every month onto one axis.
  const [windowOffset, setWindowOffset] = useState(0);
  const windowCount = Math.max(Math.ceil(series.length / WINDOW_MONTHS), 1);
  const safeOffset = Math.min(windowOffset, windowCount - 1);
  const endIndex = series.length - safeOffset * WINDOW_MONTHS;
  const startIndex = Math.max(endIndex - WINDOW_MONTHS, 0);
  const visibleSeries = series.slice(startIndex, endIndex);
  const rangeLabel =
    visibleSeries.length === 0
      ? ''
      : `${visibleSeries[0]?.label ?? ''} – ${visibleSeries.at(-1)?.label ?? ''}`;

  if (series.length === 0) {
    return (
      <ConsoleEmptyState
        description="The collections trend appears once payments exist."
        title="No payment history yet"
      />
    );
  }

  const money = (value: number) => formatCurrency(value, currencyCode);

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <article className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-(--sm-fg)">Collections</h3>
            <p className="text-xs text-(--sm-muted)">
              Billed against settled, by month. A gap is that month&rsquo;s shortfall.
            </p>
          </div>
          {series.length <= WINDOW_MONTHS ? null : (
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs text-(--sm-muted) tabular-nums">{rangeLabel}</span>
              <Button
                aria-label="Earlier months"
                className="size-7"
                disabled={startIndex === 0}
                onClick={() => setWindowOffset(safeOffset + 1)}
                size="icon"
                variant="outline"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                aria-label="Later months"
                className="size-7"
                disabled={endIndex >= series.length}
                onClick={() => setWindowOffset(Math.max(safeOffset - 1, 0))}
                size="icon"
                variant="outline"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </header>

        <ResponsiveContainer height={240} width="100%">
          <LineChart data={visibleSeries}>
            <CartesianGrid className="stroke-border" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => money(Number(value))}
              width={72}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              cursor={{ stroke: 'var(--sm-border2)' }}
              formatter={(value, name) => [money(Number(value)), name]}
              itemStyle={CHART_TOOLTIP_ITEM_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Line
              dataKey="due"
              dot={{ r: 2 }}
              name="Billed"
              stroke={CHART_SEMANTIC.unpaid}
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="collected"
              dot={{ r: 2 }}
              name="Collected"
              stroke={CHART_SEMANTIC.paid}
              strokeWidth={2.5}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </article>

      <article className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
        <header className="mb-4">
          <h3 className="text-sm font-semibold text-(--sm-fg)">Outstanding by age</h3>
          <p className="text-xs text-(--sm-muted)">
            {money(outstanding)} unsettled · oldest money first
          </p>
        </header>

        {outstanding === 0 ? (
          // Four empty bars drawn at zero say nothing; the sentence does.
          <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-(--sm-border)">
            <p className="px-6 text-center text-sm text-(--sm-muted)">
              Every payment is settled — nothing is owed.
            </p>
          </div>
        ) : (
          <ResponsiveContainer height={240} width="100%">
            <BarChart data={aging} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid className="stroke-border" horizontal={false} strokeDasharray="3 3" />
              <XAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => money(Number(value))}
                type="number"
              />
              <YAxis dataKey="label" tick={{ fontSize: 11 }} type="category" width={82} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                cursor={{ fill: 'var(--sm-hover)' }}
                formatter={(value, _name, item) => [
                  `${money(Number(value))} · ${item?.payload?.count ?? 0} payments`,
                  'Outstanding',
                ]}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              />
              <Bar dataKey="amount" radius={[0, 3, 3, 0]}>
                {aging.map((bucket) => (
                  <Cell
                    fill={
                      bucket.label === 'Not yet due'
                        ? CHART_SEMANTIC.unpaid
                        : CHART_SEMANTIC.overdue
                    }
                    key={bucket.label}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </article>
    </section>
  );
}

type PaymentTrendChartProps = {
  currencyCode: string;
  payments: PaymentTrendItem[];
};
