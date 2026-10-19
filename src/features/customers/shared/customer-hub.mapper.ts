export type HubMembership = {
  businessId: string;
  endDate: string;
  id: string;
  isRecurring: boolean;
  planId: string;
  startDate: string;
  status: string;
};

export type HubPayment = {
  amount: string;
  businessId: string;
  currencyCode: string;
  dueDate: string;
  id: string;
  membershipId: string;
  paidDate: string | null;
  status: string;
};

export type HubPlan = {
  id: string;
  name: string;
};

export type CustomerSubscription = HubMembership & {
  payments: HubPayment[];
  planLabel: string;
};

export type CustomerHub = {
  history: PaymentHistoryPoint[];
  outstandingTotal: string;
  subscriptions: CustomerSubscription[];
  unlinkedPayments: HubPayment[];
};

export const emptyCustomerHub: CustomerHub = {
  history: [],
  outstandingTotal: '0.00',
  subscriptions: [],
  unlinkedPayments: [],
};

/**
 * Folds the three flat lists into one per-subscription view.
 *
 * Kept free of any I/O so the grouping rules can be tested directly.
 */
export function buildHub(
  memberships: HubMembership[],
  payments: HubPayment[],
  plans: HubPlan[]
): CustomerHub {
  const planNames = new Map(plans.map((plan) => [plan.id, plan.name]));
  const paymentsByMembership = new Map<string, HubPayment[]>();

  for (const payment of payments) {
    const bucket = paymentsByMembership.get(payment.membershipId) ?? [];
    bucket.push(payment);
    paymentsByMembership.set(payment.membershipId, bucket);
  }

  const subscriptions = memberships
    // Newest first: the subscription an operator needs is almost always the
    // most recent one.
    .toSorted((left, right) => right.startDate.localeCompare(left.startDate))
    .map((membership) => ({
      ...membership,
      payments: paymentsByMembership.get(membership.id) ?? [],
      planLabel: planNames.get(membership.planId) ?? 'Unknown plan',
    }));

  const membershipIds = new Set(memberships.map((membership) => membership.id));

  return {
    history: buildPaymentHistory(payments),
    outstandingTotal: sumOutstanding(payments),
    subscriptions,
    // Payments whose subscription is not in this customer's list would
    // otherwise vanish from the page entirely.
    unlinkedPayments: payments.filter((payment) => !membershipIds.has(payment.membershipId)),
  };
}

export type PaymentHistoryPoint = {
  /** `YYYY-MM`, used as the sort key. */
  month: string;
  label: string;
  outstanding: number;
  paid: number;
};

/**
 * One customer's payments rolled into a month-by-month series.
 *
 * Every month between the first and last payment is emitted, including the
 * empty ones — a chart that silently skips quiet months compresses the time
 * axis and makes a lapse look like continuous activity.
 */
export function buildPaymentHistory(payments: HubPayment[]): PaymentHistoryPoint[] {
  const billable = payments.filter((payment) => payment.status !== 'cancelled');

  if (billable.length === 0) {
    return [];
  }

  const months = billable.map((payment) => payment.dueDate.slice(0, 7)).toSorted();
  const series = new Map<string, PaymentHistoryPoint>();

  for (const month of eachMonth(months[0] as string, months.at(-1) as string)) {
    series.set(month, { label: monthLabel(month), month, outstanding: 0, paid: 0 });
  }

  for (const payment of billable) {
    const point = series.get(payment.dueDate.slice(0, 7));

    if (point === undefined) continue;

    const amount = Number(payment.amount);

    if (payment.status === 'paid') {
      point.paid += amount;
    } else {
      point.outstanding += amount;
    }
  }

  return [...series.values()];
}

function eachMonth(from: string, to: string): string[] {
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

function sumOutstanding(payments: HubPayment[]): string {
  const total = payments
    .filter((payment) => payment.status === 'unpaid' || payment.status === 'overdue')
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  return total.toFixed(2);
}
