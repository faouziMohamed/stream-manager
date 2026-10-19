import { formatCurrency } from '@/lib/utils';

/**
 * Everything that ever happened to a subscription, oldest fact first.
 *
 * There is no event log, so this is derived from the rows that do exist —
 * memberships, their payments, and the profile assignments pointing at them.
 * Each event carries the timestamp of the row it came from, which means every
 * line can be traced back to something real. What it cannot show is *who* did
 * it: no table records an actor, and inventing one would be worse than the gap.
 *
 * A cancellation has no timestamp of its own, only the row's `updatedAt`. It
 * is the best available and, because a membership is updated when its status
 * changes, also the honest one — the code says so rather than presenting it as
 * exact.
 */
export function buildMembershipActivity({
  assignments = [],
  payments,
  terms,
}: MembershipActivityInput): MembershipActivityEvent[] {
  const events: MembershipActivityEvent[] = [];

  for (const term of terms) {
    events.push(
      term.renewedFromId === null
        ? {
            at: term.createdAt,
            detail: term.businessId,
            id: `${term.id}:created`,
            kind: 'created',
            title: 'Membership created',
          }
        : {
            at: term.createdAt,
            detail: `${term.businessId} · ${term.startDate} → ${term.endDate}`,
            id: `${term.id}:renewed`,
            kind: 'renewed',
            title: 'Term renewed',
          }
    );

    if (term.status === 'cancelled') {
      events.push({
        at: term.updatedAt,
        detail: `${term.businessId} · cover ended ${term.endDate}`,
        id: `${term.id}:cancelled`,
        kind: 'cancelled',
        title: 'Membership cancelled',
      });
    }
  }

  for (const payment of payments) {
    const amount = formatCurrency(Number.parseFloat(payment.amount), payment.currencyCode);

    events.push({
      at: payment.createdAt,
      detail: `${payment.businessId} · due ${payment.dueDate}`,
      id: `${payment.id}:recorded`,
      kind: 'payment',
      title: `Payment recorded · ${amount}`,
    });

    if (payment.paidDate !== null) {
      events.push({
        at: payment.paidDate,
        detail: `${payment.businessId} · ${amount}`,
        id: `${payment.id}:paid`,
        kind: 'paid',
        title: 'Payment settled',
      });
    }

    if (payment.status === 'cancelled') {
      events.push({
        at: payment.updatedAt,
        detail: `${payment.businessId} · ${amount}`,
        id: `${payment.id}:cancelled`,
        kind: 'cancelled',
        title: 'Payment cancelled',
      });
    }
  }

  for (const assignment of assignments) {
    events.push({
      at: assignment.assignedAt,
      detail: assignment.accountLabel,
      id: `${assignment.id}:assigned`,
      kind: 'profile',
      title: `Profile “${assignment.profileName}” assigned`,
    });
  }

  // Newest first: the page opens on the most recent fact, which is the one a
  // reader came to check. `at` is an ISO timestamp string, so it sorts itself.
  return events.toSorted((left, right) => {
    const byDate = right.at.localeCompare(left.at);

    return byDate === 0 ? right.id.localeCompare(left.id) : byDate;
  });
}

export type MembershipActivityKind =
  | 'cancelled'
  | 'created'
  | 'paid'
  | 'payment'
  | 'profile'
  | 'renewed';

export type MembershipActivityEvent = {
  /** ISO timestamp of the row this event was read from. */
  at: string;
  detail: string;
  id: string;
  kind: MembershipActivityKind;
  title: string;
};

export type MembershipActivityTerm = {
  businessId: string;
  createdAt: string;
  endDate: string;
  id: string;
  renewedFromId: string | null;
  startDate: string;
  status: string;
  updatedAt: string;
};

export type MembershipActivityPayment = {
  amount: string;
  businessId: string;
  createdAt: string;
  currencyCode: string;
  dueDate: string;
  id: string;
  paidDate: string | null;
  status: string;
  updatedAt: string;
};

export type MembershipActivityAssignment = {
  accountLabel: string;
  assignedAt: string;
  id: string;
  profileName: string;
};

type MembershipActivityInput = {
  assignments?: MembershipActivityAssignment[];
  payments: MembershipActivityPayment[];
  terms: MembershipActivityTerm[];
};
