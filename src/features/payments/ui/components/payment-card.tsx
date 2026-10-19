'use client';

import { CheckCircle2, Eye } from 'lucide-react';

import {
  ConsoleMobileActions,
  ConsoleMobileCard,
  ConsoleMobileCardHeader,
  ConsoleMobileFact,
} from '@/components/console/shared/console-mobile-list';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  formatPaymentStatus,
  getDueDateUrgency,
  getPaymentStatusTone,
} from '@/features/payments/shared/payment-status';
import type { PaymentsPagePayload } from '@/features/payments/server/loaders/payments.loader';
import { cn, formatCurrency } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';

type PaymentRow = PaymentsPagePayload['items'][number];

/** One payment on a phone: what is owed, to whom, when, and whether it is paid. */
export function PaymentCard({
  canManage,
  customerName,
  onMarkPaid,
  onView,
  pending,
  row,
}: PaymentCardProps) {
  const canMarkPaid = row.status === 'unpaid' || row.status === 'overdue';
  const urgency = getDueDateUrgency(row.status, row.dueDate);

  return (
    <ConsoleMobileCard>
      <ConsoleMobileCardHeader>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-(--sm-fg) tabular-nums">
            {formatCurrency(Number.parseFloat(row.amount), row.currencyCode)}
          </p>
          <p className="mt-0.5 text-xs text-(--sm-muted)">{row.businessId}</p>
        </div>
        <StatusBadge tone={getPaymentStatusTone(row.status)}>
          {formatPaymentStatus(row.status)}
        </StatusBadge>
      </ConsoleMobileCardHeader>

      <div className="mt-3 grid gap-1.5">
        <ConsoleMobileFact label="Customer" value={customerName} />
        <ConsoleMobileFact
          label="Due"
          value={
            <span
              className={cn(
                'tabular-nums',
                urgency === 'overdue' && 'font-medium text-(--sm-coral)',
                urgency === 'soon' && 'font-medium text-(--sm-gold)'
              )}
            >
              {formatDisplayDate(row.dueDate) || row.dueDate}
            </span>
          }
        />
        <ConsoleMobileFact
          label="Paid"
          value={
            row.paidDate === null ? (
              <span className="text-(--sm-muted)">—</span>
            ) : (
              <span className="tabular-nums">
                {formatDisplayDate(row.paidDate) || row.paidDate}
              </span>
            )
          }
        />
      </div>

      <ConsoleMobileActions>
        <Button onClick={onView} size="sm" variant="info">
          <Eye className="size-3.5" />
          View
        </Button>
        {canManage ? (
          <Button
            disabled={!canMarkPaid || pending}
            onClick={onMarkPaid}
            size="sm"
            variant="positive"
          >
            <CheckCircle2 className="size-3.5" />
            Mark paid
          </Button>
        ) : null}
      </ConsoleMobileActions>
    </ConsoleMobileCard>
  );
}

type PaymentCardProps = {
  /** Mark-paid is an admin mutation. */
  canManage: boolean;
  customerName: string;
  onMarkPaid: () => void;
  onView: () => void;
  pending: boolean;
  row: PaymentRow;
};
