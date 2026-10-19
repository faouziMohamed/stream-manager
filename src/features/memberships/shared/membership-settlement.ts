import type { StatusTone } from '@/components/console/shared/status-badge';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

/**
 * Whether a membership was paid for — which is not whether it is active.
 *
 * A membership carries two independent facts: access ("can they watch") and
 * money ("did they pay"). Renewing eight months without settling produces
 * eight rows reading `ACTIVE`, indistinguishable from eight that were paid
 * for, and an active-but-unpaid row is the most important row in the console.
 * One helper decides the state and one vocabulary names it, so the ledger, the
 * summary sheet and the record page cannot drift into three dialects.
 *
 * `unbilled` is its own answer, not a kind of unpaid: a term with no payment
 * row at all is a bookkeeping gap, and quietly calling it unpaid would hide
 * that the money was never asked for.
 */
export function getTermSettlement(
  membershipId: string,
  payments: SettlementPayment[]
): TermSettlement {
  const own = payments.filter((payment) => payment.membershipId === membershipId);
  const live = own.filter((payment) => payment.status !== 'cancelled');

  if (live.length === 0) {
    return { amountOwed: 0, currencyCode: undefined, label: 'Unbilled', state: 'unbilled' };
  }

  const outstanding = live.filter(
    (payment) => payment.status === 'unpaid' || payment.status === 'overdue'
  );

  if (outstanding.length === 0) {
    return { amountOwed: 0, currencyCode: live[0]?.currencyCode, label: 'Paid', state: 'paid' };
  }

  const state = outstanding.some((payment) => payment.status === 'overdue') ? 'overdue' : 'unpaid';

  return {
    amountOwed: outstanding.reduce((total, payment) => total + toAmount(payment.amount), 0),
    currencyCode: outstanding[0]?.currencyCode,
    label: state === 'overdue' ? 'Overdue' : 'Unpaid',
    state,
  };
}

/**
 * What a whole renewal chain still owes, and how much of it is settled.
 *
 * Cancelled terms are left out entirely rather than counted as owed. Their
 * payments were cancelled with them, so they owe nothing and bill nothing;
 * counting them would drag a fully paid subscription to `unbilled` the moment
 * one term in its history was cancelled.
 */
export function getChainSettlement(
  terms: ChainTerm[],
  payments: SettlementPayment[]
): ChainSettlement {
  const live = terms.filter((term) => term.status !== 'cancelled');
  const settlements = live.map((term) => getTermSettlement(term.id, payments));
  const owing = settlements.filter((term) => term.state === 'unpaid' || term.state === 'overdue');

  return {
    amountOwed: owing.reduce((total, term) => total + term.amountOwed, 0),
    currencyCode: owing.find((term) => term.currencyCode !== undefined)?.currencyCode,
    cancelledCount: terms.length - live.length,
    paidCount: settlements.filter((term) => term.state === 'paid').length,
    state: summarise(settlements),
    termCount: live.length,
    unbilledCount: settlements.filter((term) => term.state === 'unbilled').length,
    unsettledCount: owing.length,
  };
}

/** The loudest state present, because that is the one needing work. */
function summarise(terms: TermSettlement[]): SettlementState {
  if (terms.some((term) => term.state === 'overdue')) return 'overdue';
  if (terms.some((term) => term.state === 'unpaid')) return 'unpaid';
  if (terms.some((term) => term.state === 'unbilled')) return 'unbilled';

  return 'paid';
}

export function formatAmountOwed(amount: number, currencyCode?: string): string {
  return formatCurrency(amount, currencyCode ?? DEFAULT_CURRENCY);
}

export function getSettlementTone(state: SettlementState): StatusTone {
  if (state === 'paid') return 'positive';
  if (state === 'overdue') return 'critical';
  if (state === 'unpaid') return 'caution';

  return 'neutral';
}

function toAmount(value: string): number {
  const amount = Number.parseFloat(value);

  return Number.isFinite(amount) ? amount : 0;
}

export type SettlementState = 'overdue' | 'paid' | 'unbilled' | 'unpaid';

export type SettlementPayment = {
  amount: string;
  currencyCode: string;
  membershipId: string;
  status: string;
};

export type ChainTerm = {
  id: string;
  status: string;
};

export type TermSettlement = {
  amountOwed: number;
  currencyCode?: string;
  label: string;
  state: SettlementState;
};

export type ChainSettlement = {
  amountOwed: number;
  /** Terms removed from the chain's money question, not from its history. */
  cancelledCount: number;
  currencyCode?: string;
  paidCount: number;
  state: SettlementState;
  termCount: number;
  unbilledCount: number;
  unsettledCount: number;
};
