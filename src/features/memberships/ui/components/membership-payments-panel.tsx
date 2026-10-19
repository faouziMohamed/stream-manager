'use client';

import { ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useState } from 'react';

import { StatusBadge } from '@/components/console/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  formatPaymentStatus,
  getPaymentStatusTone,
} from '@/features/payments/shared/payment-status';
import type { MembershipDetailPayment } from '@/features/memberships/server/loaders/membership-detail.loader';
import { formatCurrency } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';

const PAGE_SIZE = 6;

/**
 * Every payment the subscription ever had, across every term — not just the
 * one term this page happens to be addressed by.
 *
 * Paged rather than listed: a customer who renews for a year twice has two
 * dozen rows, and the page that answers "what does this customer owe" should
 * not require scrolling past the answer to reach the history.
 */
export function MembershipPaymentsPanel({ payments }: { payments: MembershipDetailPayment[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(Math.ceil(payments.length / PAGE_SIZE), 1);
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const visible = payments.slice(start, start + PAGE_SIZE);

  if (payments.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-(--sm-border) bg-(--sm-bg) px-5 py-10 text-center">
        <CreditCard className="mx-auto size-6 text-(--sm-muted)" />
        <p className="mt-2 text-sm text-(--sm-muted)">No payments recorded yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-6">
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="size-4 text-(--sm-coral)" />
        <h2 className="text-sm font-semibold text-(--sm-fg)">Payments ({payments.length})</h2>
      </div>

      <div className="space-y-2">
        {visible.map((payment) => (
          <article
            key={payment.id}
            className="flex items-center justify-between rounded-lg border border-(--sm-border) bg-(--sm-bg) px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-(--sm-fg) tabular-nums">
                {formatCurrency(Number.parseFloat(payment.amount), payment.currencyCode)}
              </p>
              <p className="text-xs text-(--sm-muted) tabular-nums">
                {payment.businessId} · due {formatDisplayDate(payment.dueDate) || payment.dueDate}
                {payment.paidDate === null
                  ? ''
                  : ` · paid ${formatDisplayDate(payment.paidDate) || payment.paidDate}`}
              </p>
            </div>
            <StatusBadge tone={getPaymentStatusTone(payment.status)}>
              {formatPaymentStatus(payment.status)}
            </StatusBadge>
          </article>
        ))}
      </div>

      {pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-xs text-(--sm-muted) tabular-nums">
            {start + 1}–{Math.min(start + PAGE_SIZE, payments.length)} of {payments.length}
          </p>
          <div className="flex gap-2">
            <Button
              aria-label="Previous payments"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </Button>
            <Button
              aria-label="Next payments"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
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
  );
}
