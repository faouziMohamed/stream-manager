import { todayIsoDate } from '@/lib/utils/iso-date';

export type PaymentTrendItem = {
  amount: string;
  dueDate: string;
  paidDate?: string | null;
  status: string;
};

export type PaymentTrendPoint = {
  collected: number;
  due: number;
  label: string;
  /** `YYYY-MM`, the sort key. */
  month: string;
};

export type AgingBucket = {
  amount: number;
  count: number;
  label: string;
};

/** Cancelled money was never owed, so it belongs in neither series. */
function isLive(payment: PaymentTrendItem): boolean {
  return payment.status !== 'cancelled';
}

/**
 * Money due against money collected, month by month.
 *
 * Two independent series on one time axis, not a stack: `due` is keyed on the
 * due date and `collected` on the paid date, so one payment lands in both —
 * in different months when it was settled late. Adding them would count that
 * payment twice.
 *
 * Quiet months are emitted rather than skipped, so a month with no billing
 * reads as a gap instead of compressing the time axis.
 */
export function buildPaymentTrend(payments: PaymentTrendItem[]): PaymentTrendPoint[] {
  const live = payments.filter((payment) => isLive(payment));

  if (live.length === 0) {
    return [];
  }

  const months = live
    .flatMap((payment) => [
      payment.dueDate.slice(0, 7),
      payment.paidDate == null ? [] : payment.paidDate.slice(0, 7),
    ])
    .flat()
    .toSorted();

  const series = new Map<string, PaymentTrendPoint>();

  for (const month of eachMonth(months[0] as string, months.at(-1) as string)) {
    series.set(month, { collected: 0, due: 0, label: monthLabel(month), month });
  }

  for (const payment of live) {
    const amount = Number.parseFloat(payment.amount);

    if (Number.isNaN(amount)) continue;

    const duePoint = series.get(payment.dueDate.slice(0, 7));

    if (duePoint !== undefined) {
      duePoint.due += amount;
    }

    if (payment.paidDate == null) continue;

    const paidPoint = series.get(payment.paidDate.slice(0, 7));

    if (paidPoint !== undefined) {
      paidPoint.collected += amount;
    }
  }

  return [...series.values()];
}

const AGE_BRACKETS = [
  { label: 'Not yet due', maxDays: 0 },
  { label: '1–30 days', maxDays: 30 },
  { label: '31–60 days', maxDays: 60 },
  { label: '60+ days', maxDays: Number.POSITIVE_INFINITY },
] as const;

/**
 * What is still outstanding, bucketed by how long it has been owed — the view
 * that turns "2 unpaid" into a chase list ordered by risk.
 */
export function buildAgingBuckets(
  payments: PaymentTrendItem[],
  today = todayIsoDate()
): AgingBucket[] {
  const buckets: AgingBucket[] = AGE_BRACKETS.map((bracket) => ({
    amount: 0,
    count: 0,
    label: bracket.label,
  }));

  for (const payment of payments) {
    if (!isLive(payment) || payment.status === 'paid') continue;

    const amount = Number.parseFloat(payment.amount);

    if (Number.isNaN(amount)) continue;

    const daysPastDue = daysBetween(payment.dueDate, today);
    const index = AGE_BRACKETS.findIndex((bracket) => daysPastDue <= bracket.maxDays);
    const bucket = buckets[index === -1 ? buckets.length - 1 : index];

    if (bucket === undefined) continue;

    bucket.amount += amount;
    bucket.count += 1;
  }

  return buckets;
}

function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);

  if (Number.isNaN(start) || Number.isNaN(end)) return 0;

  return Math.round((end - start) / 86_400_000);
}

function eachMonth(from: string, to: string): string[] {
  if (from > to) {
    return [];
  }

  const months: string[] = [];
  let [year, month] = from.split('-').map(Number) as [number, number];

  while (`${year}-${String(month).padStart(2, '0')}` <= to) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;

    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

function monthLabel(month: string): string {
  const [year, index] = month.split('-').map(Number) as [number, number];

  return new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit' }).format(
    new Date(year, index - 1, 1)
  );
}
