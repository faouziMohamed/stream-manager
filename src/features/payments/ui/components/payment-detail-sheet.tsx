'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/console/shared/status-badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  formatPaymentStatus,
  getPaymentStatusTone,
} from '@/features/payments/shared/payment-status';
import type { PaymentsListPayload } from '@/features/payments/ui/queries/use-payments.queries';
import { ROUTES } from '@/lib/config/routes';
import { cn, formatCurrency } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';

type PaymentRow = PaymentsListPayload['items'][number];

export function PaymentDetailSheet({
  payment,
  customerName,
  membershipLabel,
  open,
  onOpenChangeAction,
}: {
  payment: PaymentRow | null;
  customerName: string;
  membershipLabel: string;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChangeAction}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {payment === null ? null : (
          <>
            <SheetHeader>
              <SheetTitle className="text-2xl">
                {formatCurrency(Number.parseFloat(payment.amount), payment.currencyCode)}
              </SheetTitle>
              <SheetDescription>{payment.businessId}</SheetDescription>
              <div className="mt-3">
                <StatusBadge tone={getPaymentStatusTone(payment.status)}>
                  {formatPaymentStatus(payment.status)}
                </StatusBadge>
              </div>
            </SheetHeader>

            <div className="space-y-4 px-4 py-3">
              <Row label="Customer">
                <Link
                  href={ROUTES.console.customerDetail(payment.customerId)}
                  className="inline-flex items-center gap-1 text-(--sm-coral) hover:underline"
                >
                  {customerName} <ArrowUpRight className="size-3.5" />
                </Link>
              </Row>
              <Row label="Membership">
                <Link
                  href={ROUTES.console.membershipDetail(payment.membershipId)}
                  className="inline-flex items-center gap-1 text-right text-(--sm-coral) hover:underline"
                >
                  {membershipLabel} <ArrowUpRight className="size-3.5 shrink-0" />
                </Link>
              </Row>
              <Row label="Due date">{formatDisplayDate(payment.dueDate) || payment.dueDate}</Row>
              <Row label="Paid date">
                {payment.paidDate === null
                  ? 'Not paid'
                  : formatDisplayDate(payment.paidDate) || payment.paidDate}
              </Row>
              <Row label="Method">{payment.method ?? '—'}</Row>
              <Row label="Recorded">{formatDisplayDate(payment.createdAt.slice(0, 10)) || '—'}</Row>

              {payment.notes ? (
                <div>
                  <p className="text-xs font-semibold tracking-wider text-(--sm-muted) uppercase">
                    Notes
                  </p>
                  <p className="mt-1 text-sm text-(--sm-fg)">{payment.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-auto border-t border-(--sm-border) px-4 py-3">
              <Link
                className={cn(buttonVariants({ variant: 'accent' }), 'w-full gap-2')}
                href={ROUTES.console.customerDetail(payment.customerId)}
              >
                Open customer page
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-(--sm-border) pb-3 text-sm last:border-0">
      <span className="shrink-0 text-(--sm-muted)">{label}</span>
      <span className="min-w-0 text-right font-medium text-(--sm-fg)">{children}</span>
    </div>
  );
}
