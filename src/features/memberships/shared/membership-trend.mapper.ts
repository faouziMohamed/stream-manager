import {
  buildMembershipChains,
  type MembershipTerm,
} from '@/features/memberships/shared/membership-chains.mapper';
import { todayIsoDate } from '@/lib/utils/iso-date';

export type MembershipTrendItem = MembershipTerm & {
  isRecurring: boolean;
  status: string;
};

export type MembershipTrendPoint = {
  active: number;
  cancelled: number;
  label: string;
  /** `YYYY-MM`, the sort key. */
  month: string;
  started: number;
  /** Recurring subscriptions whose latest renewal was not paid. */
  unpaid: number;
};

/**
 * Subscriptions per month, by the state they are in.
 *
 * A renewal is not a new subscription. Terms are grouped into chains first, so
 * a customer who renewed six times is one subscription — not six — and every
 * line counts that customer once.
 *
 * `active` is a *running* count of subscriptions in force that month. A
 * recurring subscription stays in force until it is cancelled: a term that
 * ended without a renewal means the renewal is unpaid, not that the
 * subscription died. That lapse is reported separately as `unpaid`, in the
 * month the term ended, so the active line keeps the book size and the unpaid
 * line carries the collection problem. This is how subscription billing
 * systems (Stripe's `past_due`, Netflix's hold, AWS' suspended invoices) keep
 * the two questions apart. A one-off subscription does end with its term.
 *
 * `cancelled` is the month a subscription was cancelled — an event, like
 * `unpaid`, and the reason the three lines are not stacked: adding a running
 * total to two event counts produces a number that means nothing.
 */
export function buildMembershipTrend(
  memberships: MembershipTrendItem[],
  today: string = todayIsoDate()
): MembershipTrendPoint[] {
  if (memberships.length === 0) {
    return [];
  }

  const chains = buildMembershipChains(memberships);
  const currentMonth = today.slice(0, 7);
  const starts = chains.map((chain) => chain.coverageStart.slice(0, 7)).toSorted();
  const lastEnd = chains
    .map((chain) => chain.coverageEnd.slice(0, 7))
    .toSorted()
    .at(-1) as string;
  // A recurring subscription lives past its last paid term, so the running
  // total has to reach the current month even when every term already ended.
  const hasOpenRecurring = chains.some(
    (chain) => chain.current.isRecurring && chain.current.status !== 'cancelled'
  );
  const seriesEnd = hasOpenRecurring ? maxMonth(lastEnd, currentMonth) : lastEnd;
  const series = new Map<string, MembershipTrendPoint>();

  for (const month of eachMonth(starts[0] as string, seriesEnd)) {
    series.set(month, {
      active: 0,
      cancelled: 0,
      label: monthLabel(month),
      month,
      started: 0,
      unpaid: 0,
    });
  }

  for (const chain of chains) {
    const from = chain.coverageStart.slice(0, 7);
    const to = chain.coverageEnd.slice(0, 7);
    const isCancelled = chain.current.status === 'cancelled';

    const startPoint = series.get(from);

    if (startPoint !== undefined) {
      startPoint.started += 1;
    }

    // Recurring cover continues until cancellation; a one-off ends with its
    // term. Either way, each month is counted once for the subscription.
    const activeUntil = chain.current.isRecurring && !isCancelled ? seriesEnd : to;

    for (const month of eachMonth(from, activeUntil)) {
      const point = series.get(month);

      if (point !== undefined) {
        point.active += 1;
      }
    }

    if (isCancelled) {
      const endPoint = series.get(to);

      if (endPoint !== undefined) {
        endPoint.cancelled += 1;
      }

      continue;
    }

    // The latest term ended and no renewal followed it. For a recurring
    // subscription that is an unpaid renewal, not an ended subscription: the
    // renewal was due the day after the term ended, not on its last day.
    if (chain.current.isRecurring && chain.coverageEnd < today) {
      const duePoint = series.get(renewalDueMonth(chain.coverageEnd));

      if (duePoint !== undefined) {
        duePoint.unpaid += 1;
      }
    }
  }

  return [...series.values()];
}

function maxMonth(left: string, right: string): string {
  return right > left ? right : left;
}

/** The month the next term would have started — when its payment was due. */
function renewalDueMonth(endDate: string): string {
  const date = new Date(`${endDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 7);
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
