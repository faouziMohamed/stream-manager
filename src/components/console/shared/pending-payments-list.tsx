import { formatCurrency } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';

/**
 * The payments still owed on a membership.
 *
 * The wording changes with what happens next: before a cancellation these are
 * the payments about to be cancelled, and everywhere else they are simply what
 * is outstanding. A summary sheet that promised to cancel six payments while
 * cancelling nothing was the same component reading one context's script in
 * another context.
 */
export function PendingPaymentsList({ context = 'cancel', payments }: PendingPaymentsListProps) {
  if (payments.length === 0) {
    return (
      <p className="text-sm text-(--sm-muted)">
        {context === 'cancel'
          ? 'No future charges — anything already due stays owed in the ledger.'
          : 'Nothing pending — every payment on this membership is settled.'}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-(--sm-gold-b) bg-(--sm-gold-s) p-3">
      <p className="text-xs font-semibold tracking-wider text-(--sm-gold-t) uppercase">
        {payments.length} pending payment{payments.length === 1 ? '' : 's'}
        {context === 'cancel' ? ' will be cancelled' : ' outstanding'}
      </p>
      <ul className="mt-2 space-y-1.5">
        {payments
          .toSorted((left, right) => left.dueDate.localeCompare(right.dueDate))
          .map((payment) => (
            <li
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm"
              key={payment.id}
            >
              <span className="font-medium text-(--sm-fg)">{payment.businessId}</span>
              <span className="text-(--sm-fg) tabular-nums">
                {formatCurrency(Number.parseFloat(payment.amount), payment.currencyCode)}
              </span>
              <span className="text-(--sm-muted)">
                due {formatDisplayDate(payment.dueDate) || payment.dueDate}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}

type PendingPayment = {
  amount: string;
  businessId: string;
  currencyCode: string;
  dueDate: string;
  id: string;
  status: string;
};

type PendingPaymentsListProps = {
  /** `cancel` when these payments are about to be cancelled with the membership. */
  context?: 'cancel' | 'summary';
  payments: PendingPayment[];
};
