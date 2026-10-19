'use client';

import { CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConsoleMetric } from '@/components/console/shared/console-metric';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  RecordPaymentForm,
  type RecordPaymentFormValues,
} from '@/features/payments/ui/components/record-payment-form';
import type { PaymentsListPayload } from '@/features/payments/ui/queries/use-payments.queries';
import type { PaymentsPagePayload } from '@/features/payments/server/loaders/payments.loader';
import {
  useCreatePayment,
  useMarkPaymentPaid,
  usePaymentsPage,
} from '@/features/payments/ui/queries/use-payments.queries';
import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import { ConsoleMobileList } from '@/components/console/shared/console-mobile-list';
import { PaymentCard } from '@/features/payments/ui/components/payment-card';
import {
  ConsoleHeadRow,
  ConsoleRow,
  ConsoleTable,
  ConsoleTd,
  ConsoleTh,
} from '@/components/console/shared/console-table';
import { StatusBadge } from '@/components/console/shared/status-badge';
import {
  PAYMENT_STATUS_FILTERS,
  formatPaymentStatus,
  getDueDateUrgency,
  getPaymentStatusTone,
  type PaymentStatusFilter,
} from '@/features/payments/shared/payment-status';
import { PaymentDetailSheet } from '@/features/payments/ui/components/payment-detail-sheet';
import { TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';

export function PaymentsConsole({
  canManage,
  customerOptions,
  initialPage,
  membershipOptions: membershipRows,
}: PaymentsConsoleProps) {
  const [recordOpen, setRecordOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all');
  const [viewPayment, setViewPayment] = useState<PaymentRow | undefined>();
  const [confirmPaidPayment, setConfirmPaidPayment] = useState<PaymentRow | undefined>();
  // One page at a time from the server; the counts come with it.
  const { data, isFetching } = usePaymentsPage(initialPage, {
    order: 'desc',
    page,
    pageSize: LEDGER_PAGE_SIZE,
    status: statusFilter === 'all' ? null : statusFilter,
  });
  const markPaidMutation = useMarkPaymentPaid();
  const createPaymentMutation = useCreatePayment();
  const customerNames = new Map(customerOptions.map((c) => [c.id, c.name]));
  const membershipOptions = membershipRows.map((m) => ({
    id: m.id,
    label: `${customerNames.get(m.customerId) ?? m.customerId} — ${m.businessId} (${m.status})`,
  }));
  // The picker needs the customer name to tell two memberships apart; the
  // detail sheet already names the customer one row above, so it gets the
  // membership's own identity instead.
  const membershipLabels = new Map(
    membershipRows.map((m) => [m.id, `${m.businessId} (${m.status})`])
  );

  function handleRecord(values: RecordPaymentFormValues) {
    createPaymentMutation.mutate(
      {
        membershipId: values.membershipId,
        amount: values.amount,
        currencyCode: values.currencyCode,
        dueDate: values.dueDate,
        paidDate: values.paidDate || undefined,
        method: values.method,
        notes: values.notes || undefined,
        status: values.status,
      },
      {
        onSuccess: (payment) => {
          setRecordOpen(false);
          toast.success('Payment recorded', {
            description: `${formatCurrency(Number(payment.amount), payment.currencyCode)} · ${payment.status}`,
          });
        },
        // The form has no error slot of its own yet; at minimum the operator
        // must see that recording failed instead of a dialog that closes on
        // nothing.
        onError: (error) => {
          toast.error('Could not record the payment', {
            description: error instanceof Error ? error.message : undefined,
          });
        },
      }
    );
  }
  return (
    <>
      <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <ConsoleMetric label="Paid" tone="positive" value={String(data.counts.paid)} />
        <ConsoleMetric label="Unpaid" tone="caution" value={String(data.counts.unpaid)} />
        <ConsoleMetric label="Overdue" tone="critical" value={String(data.counts.overdue)} />
        <ConsoleMetric label="Cancelled" value={String(data.counts.cancelled)} />
      </section>
      <section className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-(--sm-muted)">
            {data.total} payment{data.total === 1 ? '' : 's'}
            {statusFilter === 'all' ? '' : ` · ${formatPaymentStatus(statusFilter)}`} ·{' '}
            {isFetching ? 'Refreshing…' : 'Updated just now'}
          </p>

          {canManage ? (
            <Button variant="accent" onClick={() => setRecordOpen(true)}>
              <CreditCard className="size-4" />
              Record payment
            </Button>
          ) : null}
        </div>

        <div
          role="group"
          aria-label="Filter payments by status"
          className="flex flex-wrap items-center gap-1.5"
        >
          {PAYMENT_STATUS_FILTERS.map((filter) => (
            <Button
              key={filter}
              variant="outline"
              size="sm"
              aria-pressed={statusFilter === filter}
              className={cn(
                'rounded-full',
                statusFilter === filter &&
                  'border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral) hover:bg-(--sm-coral-s) hover:text-(--sm-coral)'
              )}
              onClick={() => {
                setStatusFilter(filter);
                setPage(1);
              }}
            >
              {filter === 'all' ? 'All' : formatPaymentStatus(filter)}
              <span className="text-xs opacity-70">{filterCount(data, filter)}</span>
            </Button>
          ))}
        </div>

        <div className="hidden md:block">
          <ConsoleTable>
            <TableHeader>
              <ConsoleHeadRow>
                <ConsoleTh>Payment</ConsoleTh>
                <ConsoleTh>Customer</ConsoleTh>
                <ConsoleTh>Due</ConsoleTh>
                <ConsoleTh>Paid</ConsoleTh>
                <ConsoleTh>Status</ConsoleTh>
                <ConsoleTh className="text-right">Actions</ConsoleTh>
              </ConsoleHeadRow>
            </TableHeader>
            <TableBody>
              {data.items.map((row) => {
                const pending = markPaidMutation.isPending && markPaidMutation.variables === row.id;
                const canMarkPaid = row.status === 'unpaid' || row.status === 'overdue';
                const urgency = getDueDateUrgency(row.status, row.dueDate);

                return (
                  <ConsoleRow key={row.id}>
                    <ConsoleTd>
                      <p className="text-sm font-semibold text-(--sm-fg)">
                        {formatCurrency(Number.parseFloat(row.amount), row.currencyCode)}
                      </p>
                      <p className="text-xs text-(--sm-muted)">{row.businessId}</p>
                    </ConsoleTd>
                    <ConsoleTd className="text-sm text-(--sm-fg)">
                      {customerNames.get(row.customerId) ?? '—'}
                    </ConsoleTd>
                    {/* Two dates, two columns: "due, then paid" in one cell
                      read as a single confusing value, and the two answer
                      different questions — what was owed when, and when it
                      was settled. */}
                    <ConsoleTd className="text-sm">
                      <span
                        className={cn(
                          'text-(--sm-fg) tabular-nums',
                          urgency === 'overdue' && 'font-medium text-(--sm-coral)',
                          urgency === 'soon' && 'font-medium text-(--sm-gold)'
                        )}
                      >
                        {formatDisplayDate(row.dueDate) || row.dueDate}
                      </span>
                    </ConsoleTd>
                    <ConsoleTd className="text-sm tabular-nums">
                      {row.paidDate === null ? (
                        <span className="text-(--sm-muted)">—</span>
                      ) : (
                        <span className="text-(--sm-fg)">
                          {formatDisplayDate(row.paidDate) || row.paidDate}
                        </span>
                      )}
                    </ConsoleTd>
                    <ConsoleTd>
                      <StatusBadge tone={getPaymentStatusTone(row.status)}>
                        {formatPaymentStatus(row.status)}
                      </StatusBadge>
                    </ConsoleTd>
                    <ConsoleTd className="text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <Button variant="info" size="sm" onClick={() => setViewPayment(row)}>
                          <Eye className="size-3.5" />
                          View
                        </Button>
                        {canManage ? (
                          <Button
                            variant="positive"
                            size="sm"
                            disabled={!canMarkPaid || pending}
                            onClick={() => setConfirmPaidPayment(row)}
                          >
                            <CheckCircle2 className="size-3.5" />
                            Mark paid
                          </Button>
                        ) : null}
                      </div>
                    </ConsoleTd>
                  </ConsoleRow>
                );
              })}

              {data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <ConsoleEmptyState
                      bordered={false}
                      title={
                        statusFilter === 'all'
                          ? 'No payments yet'
                          : `No ${formatPaymentStatus(statusFilter).toLowerCase()} payments`
                      }
                      description={
                        statusFilter === 'all'
                          ? 'Record a payment to start tracking it.'
                          : 'Try another status filter or record a new payment.'
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </ConsoleTable>
        </div>

        <ConsoleMobileList>
          {data.items.map((row) => {
            const pending = markPaidMutation.isPending && markPaidMutation.variables === row.id;

            return (
              <PaymentCard
                key={row.id}
                canManage={canManage}
                customerName={customerNames.get(row.customerId) ?? '—'}
                onMarkPaid={() => setConfirmPaidPayment(row)}
                onView={() => setViewPayment(row)}
                pending={pending}
                row={row}
              />
            );
          })}
          {data.items.length === 0 ? (
            <ConsoleEmptyState
              title={
                statusFilter === 'all'
                  ? 'No payments yet'
                  : `No ${formatPaymentStatus(statusFilter).toLowerCase()} payments`
              }
              description={
                statusFilter === 'all'
                  ? 'Record a payment to start tracking it.'
                  : 'Try another status filter or record a new payment.'
              }
            />
          ) : null}
        </ConsoleMobileList>

        {data.totalPages > 1 ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-(--sm-muted) tabular-nums">
              Page {data.page} of {data.totalPages} · {data.total} payment
              {data.total === 1 ? '' : 's'} in this filter
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
                disabled={data.page >= data.totalPages}
                onClick={() => setPage(Math.min(data.page + 1, data.totalPages))}
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

      <RecordPaymentForm
        open={recordOpen}
        isPending={createPaymentMutation.isPending}
        membershipOptions={membershipOptions}
        onOpenChangeAction={setRecordOpen}
        onSubmitAction={handleRecord}
      />

      <PaymentDetailSheet
        payment={viewPayment ?? null}
        customerName={
          viewPayment === undefined
            ? ''
            : (customerNames.get(viewPayment.customerId) ?? viewPayment.customerId)
        }
        membershipLabel={
          viewPayment === undefined
            ? ''
            : (membershipLabels.get(viewPayment.membershipId) ?? viewPayment.membershipId)
        }
        open={viewPayment !== undefined}
        onOpenChangeAction={(open) => {
          if (!open) setViewPayment(undefined);
        }}
      />

      <AlertDialog
        open={confirmPaidPayment !== undefined}
        onOpenChange={(open) => {
          if (!open) setConfirmPaidPayment(undefined);
        }}
      >
        <AlertDialogContent className="border border-(--sm-border) bg-(--sm-surface)">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-(--sm-emerald-s) text-(--sm-emerald-t)">
              <CheckCircle2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Mark this payment as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmPaidPayment === undefined
                ? ''
                : `${formatCurrency(Number.parseFloat(confirmPaidPayment.amount), confirmPaidPayment.currencyCode)} for ${customerNames.get(confirmPaidPayment.customerId) ?? confirmPaidPayment.customerId} falls due ${formatDisplayDate(confirmPaidPayment.dueDate) || confirmPaidPayment.dueDate}. This records the payment as settled today.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep unpaid</AlertDialogCancel>
            <AlertDialogAction
              disabled={markPaidMutation.isPending}
              onClick={() => {
                if (confirmPaidPayment === undefined) return;
                markPaidMutation.mutate(confirmPaidPayment.id);
                setConfirmPaidPayment(undefined);
              }}
            >
              Mark paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type PaymentsConsoleProps = {
  /** Record and mark-paid are admin mutations. */
  canManage: boolean;
  customerOptions: PaymentsListPayload['customerOptions'];
  initialPage: PaymentsPagePayload;
  membershipOptions: PaymentsListPayload['membershipOptions'];
};

const LEDGER_PAGE_SIZE = 20;

type PaymentRow = PaymentsPagePayload['items'][number];

function filterCount(data: PaymentsPagePayload, filter: PaymentStatusFilter): number {
  if (filter === 'all') return data.counts.total;
  if (filter === 'paid') return data.counts.paid;
  if (filter === 'unpaid') return data.counts.unpaid;
  if (filter === 'overdue') return data.counts.overdue;

  return data.counts.cancelled;
}
