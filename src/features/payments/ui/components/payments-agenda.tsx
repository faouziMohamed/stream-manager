'use client';

import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmActionDialog } from '@/components/console/shared/confirm-action-dialog';
import { Button } from '@/components/ui/button';
import {
  buildPaymentEvents,
  type PaymentEvent,
} from '@/features/payments/shared/payment-calendar.mapper';
import { formatPaymentStatus } from '@/features/payments/shared/payment-status';
import { PaymentsAgendaList } from '@/features/payments/ui/components/payments-agenda-list';
import { PaymentDetailSheet } from '@/features/payments/ui/components/payment-detail-sheet';
import type { PaymentsPagePayload } from '@/features/payments/server/loaders/payments.loader';
import {
  useMarkPaymentPaid,
  usePaymentsPage,
} from '@/features/payments/ui/queries/use-payments.queries';
import { formatCurrency } from '@/lib/utils';

const PAGE_SIZE = 25;

/**
 * The collection run: every payment in due-date order, oldest first.
 *
 * Ordered ascending on purpose — the top of this list is the money that has
 * been owed longest — and it pages on the server so a year of history does not
 * arrive with the first screen. Settling a payment happens here rather than
 * sending the operator to the ledger, which is the whole point of working down
 * this list.
 */
export function PaymentsAgenda({
  canManage,
  customerOptions,
  initialPage,
  membershipOptions,
}: PaymentsAgendaProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('all');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [viewPayment, setViewPayment] = useState<PaymentEvent | null>(null);
  const [settleTarget, setSettleTarget] = useState<PaymentEvent | null>(null);

  const { data } = usePaymentsPage(initialPage, {
    order,
    page,
    pageSize: PAGE_SIZE,
    status: status === 'all' ? null : status,
  });
  const markPaidMutation = useMarkPaymentPaid();

  const customerNames = useMemo(
    () => new Map(customerOptions.map((customer) => [customer.id, customer.name])),
    [customerOptions]
  );
  const membershipLabels = useMemo(
    () =>
      new Map(
        membershipOptions.map((membership) => [
          membership.id,
          `${membership.businessId} (${membership.status})`,
        ])
      ),
    [membershipOptions]
  );
  const events = useMemo(
    () => buildPaymentEvents(data.items, customerNames),
    [customerNames, data.items]
  );

  const pageCount = Math.max(data.totalPages, 1);
  const statuses = ['all', 'unpaid', 'overdue', 'paid', 'cancelled'] as const;

  function changeStatus(next: string) {
    setStatus(next);
    setPage(1);
  }

  function toggleOrder() {
    setOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    setPage(1);
  }

  return (
    <>
      <section className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-(--sm-muted) tabular-nums">
              {data.total} payment{data.total === 1 ? '' : 's'} ·{' '}
              {order === 'asc' ? 'oldest due first' : 'newest due first'}
            </p>
            <Button
              aria-label="Newest due first"
              aria-pressed={order === 'desc'}
              onClick={toggleOrder}
              size="sm"
              variant="outline"
            >
              {order === 'asc' ? (
                <ArrowDownWideNarrow className="size-3.5" />
              ) : (
                <ArrowUpNarrowWide className="size-3.5" />
              )}
              {order === 'asc' ? 'Oldest first' : 'Newest first'}
            </Button>
          </div>
          <div
            aria-label="Filter payments by status"
            className="flex flex-wrap items-center gap-1.5"
            role="group"
          >
            {statuses.map((value) => (
              <Button
                aria-pressed={status === value}
                className="rounded-full"
                key={value}
                onClick={() => changeStatus(value)}
                size="sm"
                variant="outline"
              >
                {value === 'all' ? 'All' : formatPaymentStatus(value)}
                <span className="text-xs opacity-70">{countFor(data, value)}</span>
              </Button>
            ))}
          </div>
        </div>

        <PaymentsAgendaList
          events={events}
          onOpen={setViewPayment}
          order={order}
          renderAction={
            canManage
              ? (event) =>
                  event.status === 'unpaid' || event.status === 'overdue' ? (
                    <Button
                      aria-label={`Mark ${event.businessId} paid`}
                      className="h-auto w-10 shrink-0 justify-center"
                      onClick={() => setSettleTarget(event)}
                      size="sm"
                      variant="positive"
                    >
                      <CheckCircle2 className="size-3.5" />
                    </Button>
                  ) : null
              : undefined
          }
        />

        {pageCount > 1 ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-(--sm-muted) tabular-nums">
              Page {data.page} of {pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                aria-label="Previous page"
                disabled={data.page <= 1}
                onClick={() => setPage(Math.max(data.page - 1, 1))}
                size="sm"
                variant="outline"
              >
                <ChevronLeft className="size-3.5" />
                Previous
              </Button>
              <Button
                aria-label="Next page"
                disabled={data.page >= pageCount}
                onClick={() => setPage(Math.min(data.page + 1, pageCount))}
                size="sm"
                variant="outline"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <PaymentDetailSheet
        customerName={viewPayment === null ? '' : (customerNames.get(viewPayment.customerId) ?? '')}
        membershipLabel={
          viewPayment === null ? '' : (membershipLabels.get(viewPayment.membershipId) ?? '')
        }
        onOpenChangeAction={(open) => {
          if (!open) setViewPayment(null);
        }}
        open={viewPayment !== null}
        payment={viewPayment}
      />

      <ConfirmActionDialog
        cancelLabel="Keep unpaid"
        confirmLabel="Mark paid"
        description={
          settleTarget === null
            ? ''
            : `${formatCurrency(Number.parseFloat(settleTarget.amount), settleTarget.currencyCode)} for ${settleTarget.customerName}, due ${settleTarget.dueDate}. This records it as settled today.`
        }
        icon={<CheckCircle2 className="size-5" />}
        onConfirm={() => {
          if (settleTarget === null) return;
          markPaidMutation.mutate(settleTarget.id, {
            onSuccess: () => toast.success('Payment marked paid'),
          });
          setSettleTarget(null);
        }}
        onOpenChangeAction={(open) => {
          if (!open) setSettleTarget(null);
        }}
        open={settleTarget !== null}
        pending={markPaidMutation.isPending}
        title="Mark this payment as paid?"
        tone="accent"
      />
    </>
  );
}

function countFor(data: PaymentsPagePayload, status: string): number {
  if (status === 'all') return data.counts.total;
  if (status === 'paid') return data.counts.paid;
  if (status === 'unpaid') return data.counts.unpaid;
  if (status === 'overdue') return data.counts.overdue;

  return data.counts.cancelled;
}

type PaymentsAgendaProps = {
  /** Mark-paid is an admin mutation. */
  canManage: boolean;
  customerOptions: { id: string; name: string }[];
  initialPage: PaymentsPagePayload;
  membershipOptions: { businessId: string; customerId: string; id: string; status: string }[];
};
