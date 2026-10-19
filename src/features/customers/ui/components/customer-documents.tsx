'use client';

import { Check, CheckCircle2, Download, FileText, Loader2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { Button } from '@/components/ui/button';
import type { CustomerHub, HubPayment } from '@/features/customers/shared/customer-hub.mapper';
import { useCustomerHub } from '@/features/customers/ui/queries/use-customer-hub.queries';
import { generateDocumentAction } from '@/features/documents/server/actions/generate-document.action';
import {
  formatPaymentStatus,
  getPaymentStatusTone,
} from '@/features/payments/shared/payment-status';
import { cn, formatCurrency } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';

type DocumentKind = 'bill' | 'receipt';

/**
 * Bills and receipts for one customer, in bulk.
 *
 * The kind is chosen before the rows, because it decides which rows exist:
 * a bill can only cover money still owed and a receipt only money already
 * paid, so showing every payment and then refusing half of them would be a
 * worse way to say the same thing. The selection can never mix the two, which
 * is what keeps the two document kinds apart by construction.
 */
export function CustomerDocuments({
  customerId,
  initialHub,
}: {
  customerId: string;
  initialHub: CustomerHub;
}) {
  // The same live query the subscriptions panel uses: after a payment is
  // settled or a membership cancelled, the list here has to move with it, or
  // a bill can be generated against a payment that no longer qualifies.
  const { data: hub } = useCustomerHub(customerId, initialHub);
  const [kind, setKind] = useState<DocumentKind>('bill');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const payments = useMemo(() => hubPayments(hub), [hub]);
  const eligible = payments.filter((payment) =>
    kind === 'bill'
      ? payment.status === 'unpaid' || payment.status === 'overdue'
      : payment.status === 'paid'
  );

  function changeKind(next: DocumentKind) {
    setKind(next);
    setSelected(new Set());
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function generate() {
    setPending(true);

    try {
      const result = await generateDocumentAction({
        customerId,
        kind,
        paymentIds: [...selected],
      });

      if (!result.ok) {
        toast.error('Could not generate the document', { description: result.error });
        return;
      }

      downloadBase64(result.base64, result.filename);
      toast.success(kind === 'bill' ? 'Bill generated' : 'Receipt generated', {
        description: `${selected.size} payment${selected.size === 1 ? '' : 's'} · ${result.filename}`,
      });
      setSelected(new Set());
    } catch (error) {
      toast.error('Could not generate the document', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-(--sm-fg)">Documents</h2>
          <p className="mt-1 text-xs text-(--sm-muted)">
            Written in this customer&rsquo;s language. Bills cover what is owed, receipts what was
            paid — never both in one document.
          </p>
        </div>
        <div aria-label="Document kind" className="flex items-center gap-1.5" role="group">
          <KindButton active={kind === 'bill'} onClick={() => changeKind('bill')}>
            Bill
          </KindButton>
          <KindButton active={kind === 'receipt'} onClick={() => changeKind('receipt')}>
            Receipt
          </KindButton>
        </div>
      </div>

      {eligible.length === 0 ? (
        <ConsoleEmptyState
          description={
            kind === 'bill'
              ? 'Nothing is owed on this account.'
              : 'No payment has been settled yet.'
          }
          icon={<FileText className="size-4" />}
          title={kind === 'bill' ? 'No open payments' : 'No settled payments'}
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs text-(--sm-muted) tabular-nums">
              {eligible.length} eligible payment{eligible.length === 1 ? '' : 's'}
            </p>
            <Button
              onClick={() =>
                setSelected(
                  selected.size === eligible.length
                    ? new Set()
                    : new Set(eligible.map((payment) => payment.id))
                )
              }
              size="sm"
              variant="outline"
            >
              {selected.size === eligible.length ? 'Clear selection' : 'Select all'}
            </Button>
          </div>

          <ul className="divide-y divide-(--sm-border) overflow-hidden rounded-lg border border-(--sm-border)">
            {eligible.map((payment) => {
              const checked = selected.has(payment.id);

              return (
                <li key={payment.id}>
                  {/* A toggle button rather than a checkbox: the console has
                      no checkbox primitive and this is the same pattern the
                      filter chips already use. */}
                  <Button
                    aria-pressed={checked}
                    className={cn(
                      'flex h-auto w-full justify-start gap-3 rounded-none px-4 py-3 text-left font-normal',
                      checked && 'bg-(--sm-surface2) hover:bg-(--sm-hover)'
                    )}
                    onClick={() => toggle(payment.id)}
                    variant="ghost"
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded border',
                        checked
                          ? 'border-(--sm-coral) bg-(--sm-coral) text-white'
                          : 'border-(--sm-border2)'
                      )}
                    >
                      {checked ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-(--sm-fg) tabular-nums">
                        {formatCurrency(Number.parseFloat(payment.amount), payment.currencyCode)}
                      </span>
                      <span className="block text-xs text-(--sm-muted) tabular-nums">
                        {payment.businessId} · due{' '}
                        {formatDisplayDate(payment.dueDate) || payment.dueDate}
                        {payment.paidDate === null
                          ? ''
                          : ` · paid ${formatDisplayDate(payment.paidDate) || payment.paidDate}`}
                      </span>
                    </span>
                    <StatusBadge tone={getPaymentStatusTone(payment.status)}>
                      {formatPaymentStatus(payment.status)}
                    </StatusBadge>
                  </Button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-(--sm-muted) tabular-nums">{selected.size} selected</p>
            <Button disabled={selected.size === 0 || pending} onClick={generate} variant="accent">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {pending
                ? 'Generating…'
                : `Generate ${kind === 'bill' ? 'bill' : 'receipt'} (${selected.size})`}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

function KindButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      aria-pressed={active}
      className={cn(
        'rounded-full',
        active &&
          'border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral) hover:bg-(--sm-coral-s) hover:text-(--sm-coral)'
      )}
      onClick={onClick}
      size="sm"
      variant="outline"
    >
      {active ? <CheckCircle2 className="size-3.5" /> : <FileText className="size-3.5" />}
      {children}
    </Button>
  );
}

/** Every payment the hub knows about, from the subscriptions and the orphans. */
function hubPayments(hub: CustomerHub): HubPayment[] {
  return [
    ...hub.subscriptions.flatMap((subscription) => subscription.payments),
    ...hub.unlinkedPayments,
  ].toSorted((left, right) => right.dueDate.localeCompare(left.dueDate));
}

function downloadBase64(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.codePointAt(index) ?? 0;
  }

  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
