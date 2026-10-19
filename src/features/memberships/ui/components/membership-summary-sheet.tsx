'use client';

import { ArrowRight, Wallet } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { PendingPaymentsList } from '@/components/console/shared/pending-payments-list';
import { SettlementBadge } from '@/features/memberships/ui/components/settlement-badge';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  type ChainSettlement,
  formatAmountOwed,
} from '@/features/memberships/shared/membership-settlement';
import {
  formatMembershipPhase,
  getMembershipPhase,
  getMembershipPhaseTone,
} from '@/features/memberships/shared/membership-status';
import type { MembershipsListPayload } from '@/features/memberships/ui/queries/use-memberships.queries';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';

/**
 * What a row click shows: whose membership this is, its term and what is still
 * owed. The page keeps the full payment history and the lifecycle actions.
 */
export function MembershipSummarySheet({
  chain = null,
  customerName,
  membership,
  onOpenChangeAction,
  open,
  pendingPayments,
  planName,
  settlement = null,
}: MembershipSummarySheetProps) {
  // The sheet speaks for the whole chain when it has one, so the badge asks
  // whether the subscription is covered today, not whether this one term is.
  const phase =
    membership === null
      ? 'expired'
      : getMembershipPhase(
          membership.status,
          chain?.coverageStart ?? membership.startDate,
          chain?.coverageEnd ?? membership.endDate,
          undefined,
          membership.isRecurring
        );

  return (
    <Sheet open={open} onOpenChange={onOpenChangeAction}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {membership === null ? null : (
          <>
            <SheetHeader>
              <SheetTitle className="truncate">{customerName}</SheetTitle>
              <SheetDescription>
                {planName} · {membership.businessId}
              </SheetDescription>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <StatusBadge tone={getMembershipPhaseTone(phase)}>
                  {formatMembershipPhase(phase)}
                </StatusBadge>
                {settlement === null ? null : (
                  <SettlementBadge state={settlement.state}>
                    {settlementLabel(settlement)}
                  </SettlementBadge>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-4 px-4 py-3">
              <Row label={chain === null ? 'Term' : 'Covered'}>
                {formatDisplayDate(chain?.coverageStart ?? membership.startDate) ||
                  membership.startDate}{' '}
                →{' '}
                {formatDisplayDate(chain?.coverageEnd ?? membership.endDate) || membership.endDate}
              </Row>
              {chain === null ? null : (
                <Row label="Terms">
                  {chain.termCount} · current{' '}
                  {formatDisplayDate(membership.startDate) || membership.startDate} →{' '}
                  {formatDisplayDate(membership.endDate) || membership.endDate}
                </Row>
              )}
              <Row label="Recurring">{membership.isRecurring ? 'Yes' : 'No'}</Row>
              <Row label="Pending payments">{String(pendingPayments.length)}</Row>

              {pendingPayments.length > 0 ? (
                <PendingPaymentsList context="summary" payments={pendingPayments} />
              ) : null}
            </div>

            <SheetFooter className="gap-2">
              {/* The ledger is where a payment is settled; this sheet only
                  reports that one is owed, so it hands the operator over
                  rather than making them find the page themselves. */}
              <Link
                className={cn(buttonVariants({ variant: 'info' }), 'w-full gap-2')}
                href={ROUTES.console.payments}
              >
                <Wallet className="size-4" />
                Go to payments
              </Link>
              <Link
                className={cn(buttonVariants({ variant: 'accent' }), 'w-full gap-2')}
                href={ROUTES.console.membershipDetail(membership.id)}
              >
                Open membership page
                <ArrowRight className="size-4" />
              </Link>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function settlementLabel(settlement: ChainSettlement): string {
  if (settlement.state === 'paid') return 'Paid';
  if (settlement.state === 'unbilled') return 'Unbilled';

  return `${formatAmountOwed(settlement.amountOwed, settlement.currencyCode)} owed`;
}

function Row({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-(--sm-border) pb-3 text-sm last:border-0">
      <span className="shrink-0 text-(--sm-muted)">{label}</span>
      <span className="min-w-0 text-right font-medium text-(--sm-fg)">{children}</span>
    </div>
  );
}

type MembershipRow = MembershipsListPayload['items'][number];

type MembershipSummarySheetProps = {
  /** Set when the sheet speaks for a whole renewal chain, not one term. */
  chain?: { coverageEnd: string; coverageStart: string; termCount: number } | null;
  customerName: string;
  membership: MembershipRow | null;
  onOpenChangeAction: (open: boolean) => void;
  open: boolean;
  pendingPayments: MembershipsListPayload['pendingPayments'];
  planName: string;
  /** Settled state for the terms this sheet speaks for; `null` while closed. */
  settlement?: ChainSettlement | null;
};
