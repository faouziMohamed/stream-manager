'use client';

import { useState, type ReactNode } from 'react';
import { CalendarDays, RefreshCw, Repeat2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { ConfirmActionDialog } from '@/components/console/shared/confirm-action-dialog';
import { PendingPaymentsList } from '@/components/console/shared/pending-payments-list';
import { MembershipActivityTimeline } from '@/features/memberships/ui/components/membership-activity-timeline';
import { MembershipPaymentsPanel } from '@/features/memberships/ui/components/membership-payments-panel';
import { RenewMembershipDialog } from '@/features/memberships/ui/components/renew-membership-dialog';
import { Button } from '@/components/ui/button';
import type { MembershipDetailPayload } from '@/features/memberships/server/loaders/membership-detail.loader';
import {
  useCancelMembership,
  useRenewMembership,
} from '@/features/memberships/ui/queries/use-memberships.queries';
import { ROUTES } from '@/lib/config/routes';
import { StatusBadge, type StatusTone } from '@/components/console/shared/status-badge';
import {
  formatAmountOwed,
  getTermSettlement,
  type TermSettlement,
} from '@/features/memberships/shared/membership-settlement';
import { SettlementBadge } from '@/features/memberships/ui/components/settlement-badge';
import {
  formatMembershipPhase,
  getMembershipPhase,
  getMembershipPhaseTone,
} from '@/features/memberships/shared/membership-status';
import { formatCurrency } from '@/lib/utils';
import { formatDisplayDate, todayIsoDate } from '@/lib/utils/iso-date';

export function MembershipDetail({ canManage, payload }: MembershipDetailProps) {
  const { activities, canRenew, chain, customer, membership, payments, plan } = payload;
  const [cancelOpen, setCancelOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);

  const cancelMutation = useCancelMembership();
  const renewMutation = useRenewMembership();

  if (membership === null) return null;

  // Renewing and cancelling act on the term itself, so the phase is the term's
  // dates; a term paid ahead of its start date is not "active" yet.
  const termPhase = getMembershipPhase(membership.status, membership.startDate, membership.endDate);
  const isCancelled = membership.status === 'cancelled';
  // A term paid in advance can still be cancelled or extended before it
  // starts; only a cancelled term is closed to both.
  const canRenewNow = canRenew && !isCancelled;
  const canCancelNow = !isCancelled && (termPhase === 'active' || termPhase === 'upcoming');
  // A cancelled term has no money question: its payments were cancelled with
  // it, so the badge is left out rather than shown as unbilled.
  const settlement = getTermSettlement(membership.id, payments);

  function handleCancel() {
    cancelMutation.mutate(membership!.id, {
      onSuccess: () => {
        setCancelOpen(false);
        toast.success('Membership cancelled');
      },
    });
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-6">
            <h2 className="mb-5 text-sm font-semibold text-(--sm-fg)">Details</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {/* The subscription's cover, not this term's slice: opening term
                  three of nine should say when the customer is covered to. */}
              <InfoField icon={<CalendarDays className="size-3.5" />} label="Covered">
                {formatDisplayDate(chain.coverageStart) || membership.startDate} →{' '}
                {formatDisplayDate(chain.coverageEnd) || membership.endDate}
              </InfoField>
              <InfoField icon={<Repeat2 className="size-3.5" />} label="Terms">
                {chain.termCount}
              </InfoField>
              <InfoField icon={<Repeat2 className="size-3.5" />} label="Recurring">
                {membership.isRecurring ? 'Yes' : 'No'}
              </InfoField>
              <InfoField label="Status">
                <StatusBadge tone={getMembershipPhaseTone(termPhase)}>
                  {formatMembershipPhase(termPhase)}
                </StatusBadge>
              </InfoField>
              {/* Access and money are separate facts here too; this page was
                  the one screen still showing only the first. A cancelled term
                  has no money question, so it carries no badge. */}
              {membership.status === 'cancelled' ? null : (
                <InfoField label="Payment">
                  <SettlementBadge state={settlement.state}>
                    {termSettlementLabel(settlement)}
                  </SettlementBadge>
                </InfoField>
              )}
              {customer === null ? null : (
                <InfoField label="Customer">
                  <Link
                    href={ROUTES.console.customerDetail(customer.id)}
                    className="text-(--sm-coral) hover:underline"
                  >
                    {customer.name}
                  </Link>
                </InfoField>
              )}
              {plan === null ? null : (
                <InfoField label="Plan">
                  {plan.name} · {formatCurrency(Number(plan.price), plan.currencyCode)}
                </InfoField>
              )}
            </dl>
          </section>

          <MembershipPaymentsPanel payments={payments} />
          <MembershipActivityTimeline activities={activities} />
        </div>

        {canManage ? (
          <aside className="space-y-4">
            <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
              <h2 className="mb-4 text-sm font-semibold text-(--sm-fg)">Actions</h2>
              <div className="flex flex-col gap-2">
                <Button
                  variant="positive"
                  size="sm"
                  className="justify-start"
                  disabled={!canRenewNow || renewMutation.isPending}
                  title={renewBlockedReason(canRenew, isCancelled)}
                  onClick={() => setRenewOpen(true)}
                >
                  <RefreshCw className="size-3.5" />
                  Renew membership
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="justify-start"
                  disabled={!canCancelNow || cancelMutation.isPending}
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle className="size-3.5" />
                  Cancel membership
                </Button>
              </div>
            </section>
          </aside>
        ) : null}
      </div>

      <ConfirmActionDialog
        cancelLabel="Keep membership"
        confirmLabel="Cancel membership"
        description="This ends the membership immediately. Future charges are cancelled; anything already due stays owed in the ledger."
        details={
          <PendingPaymentsList
            payments={payments.filter(
              (payment) =>
                payment.membershipId === membership.id &&
                (payment.status === 'unpaid' || payment.status === 'overdue') &&
                payment.dueDate > todayIsoDate()
            )}
          />
        }
        icon={<XCircle className="size-5" />}
        onConfirm={handleCancel}
        onOpenChangeAction={setCancelOpen}
        open={cancelOpen}
        pending={cancelMutation.isPending}
        title="Cancel this membership?"
        tone="destructive"
      />

      {renewOpen ? (
        <RenewMembershipDialog
          customerName={customer?.name ?? 'This customer'}
          endDate={membership.endDate}
          isPending={renewMutation.isPending}
          onConfirmAction={({ markPaid, terms }) => {
            renewMutation.mutate(
              { id: membership.id, markPaid, terms },
              {
                onSuccess: () => {
                  setRenewOpen(false);
                  toast.success('Membership renewed', {
                    description: `${terms} term${terms === 1 ? '' : 's'}${markPaid ? ' · settled now' : ''}`,
                  });
                },
              }
            );
          }}
          onOpenChangeAction={setRenewOpen}
          open
          plan={
            plan === null
              ? null
              : {
                  currencyCode: plan.currencyCode,
                  durationMonths: plan.durationMonths,
                  name: plan.name,
                  price: plan.price,
                }
          }
        />
      ) : null}
    </>
  );
}

type MembershipDetailProps = {
  /** Renew and cancel are admin mutations. */
  canManage: boolean;
  payload: MembershipDetailPayload;
};

function termSettlementLabel(settlement: TermSettlement): string {
  if (settlement.state === 'paid') return 'Paid';
  if (settlement.state === 'unbilled') return 'Unbilled';

  return `${settlement.label} ${formatAmountOwed(settlement.amountOwed, settlement.currencyCode)}`;
}

function renewBlockedReason(canRenew: boolean, isCancelled: boolean): string | undefined {
  if (isCancelled) return 'A cancelled membership cannot be renewed';
  if (!canRenew) return 'Plan or linked service is inactive';

  return undefined;
}

function InfoField({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon?: ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-(--sm-muted)">
        {icon}
        {label}
      </dt>
      <dd className="text-sm text-(--sm-fg)">{children}</dd>
    </div>
  );
}

function getStatusTone(status: string): StatusTone {
  if (status === 'active' || status === 'paid') return 'positive';
  if (status === 'cancelled' || status === 'overdue') return 'critical';
  if (status === 'pending' || status === 'unpaid') return 'caution';
  return 'neutral';
}
