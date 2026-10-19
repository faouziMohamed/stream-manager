import { todayIsoDate } from '@/lib/utils/iso-date';

export type PaymentEventItem = {
  amount: string;
  businessId: string;
  createdAt: string;
  currencyCode: string;
  customerId: string;
  dueDate: string;
  id: string;
  membershipId: string;
  method: string | null;
  notes: string | null;
  paidDate: string | null;
  status: string;
  updatedAt: string;
};

export type PaymentEvent = PaymentEventItem & {
  /** Resolved customer name, so the calendar cell never shows a raw id. */
  customerName: string;
  /** Where this event sits relative to today — drives past/present/future styling. */
  timeframe: 'past' | 'today' | 'future';
};

/**
 * Buckets payments by the day they are due, which is the date an operator
 * actually plans around. A settled payment keeps its due date in the grid so
 * the month still reads as a complete history rather than only open work.
 */
export function buildPaymentEvents(
  payments: PaymentEventItem[],
  customerNames: Map<string, string>,
  today = todayIsoDate()
): Map<string, PaymentEvent[]> {
  const byDay = new Map<string, PaymentEvent[]>();

  for (const payment of payments) {
    const event: PaymentEvent = {
      ...payment,
      customerName: customerNames.get(payment.customerId) ?? 'Unknown customer',
      timeframe: timeframeOf(payment.dueDate, today),
    };

    const bucket = byDay.get(payment.dueDate) ?? [];
    bucket.push(event);
    byDay.set(payment.dueDate, bucket);
  }

  // Largest amount first inside a day: the money that matters leads the cell.
  for (const [day, bucket] of byDay) {
    byDay.set(
      day,
      bucket.toSorted((left, right) => Number(right.amount) - Number(left.amount))
    );
  }

  return byDay;
}

function timeframeOf(dueDate: string, today: string): PaymentEvent['timeframe'] {
  if (dueDate < today) return 'past';
  if (dueDate === today) return 'today';

  return 'future';
}

/**
 * Day groups in the direction the reader asked for.
 *
 * An agenda normally runs forward — you work down the coming dates — but a
 * bookkeeper checking what just happened reads it backwards, so the direction
 * is a choice rather than a constant.
 */
export function toAgenda(
  events: Map<string, PaymentEvent[]>,
  order: 'asc' | 'desc' = 'asc'
): [string, PaymentEvent[]][] {
  const days = [...events.entries()].toSorted(([left], [right]) => left.localeCompare(right));

  return order === 'asc' ? days : days.toReversed();
}

export function countByStatus(payments: PaymentEventItem[]): Record<string, number> {
  const counts: Record<string, number> = { all: payments.length };

  for (const payment of payments) {
    counts[payment.status] = (counts[payment.status] ?? 0) + 1;
  }

  return counts;
}
