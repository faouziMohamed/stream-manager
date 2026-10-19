'use client';

import {
  CalendarClock,
  ChevronDown,
  ExternalLink,
  Filter,
  Plus,
  RefreshCw,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmActionDialog } from '@/components/console/shared/confirm-action-dialog';
import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { ConsoleMetric } from '@/components/console/shared/console-metric';
import { PendingPaymentsList } from '@/components/console/shared/pending-payments-list';
import { Button, buttonVariants } from '@/components/ui/button';
import { MembershipChainTerms } from '@/features/memberships/ui/components/membership-chain-terms';
import { SettlementBadge } from '@/features/memberships/ui/components/settlement-badge';
import { MembershipCreateForm } from '@/features/memberships/ui/components/membership-create-form';
import { MembershipSummarySheet } from '@/features/memberships/ui/components/membership-summary-sheet';
import { RenewMembershipDialog } from '@/features/memberships/ui/components/renew-membership-dialog';
import { buildMembershipChains } from '@/features/memberships/shared/membership-chains.mapper';
import {
  type ChainSettlement,
  formatAmountOwed,
  getChainSettlement,
} from '@/features/memberships/shared/membership-settlement';
import { activeOnly, labelsById } from '@/features/memberships/shared/membership-labels';
import type { MembershipsListPayload } from '@/features/memberships/ui/queries/use-memberships.queries';
import {
  useCancelMembership,
  useCreateMembership,
  useMemberships,
  useRenewMembership,
} from '@/features/memberships/ui/queries/use-memberships.queries';
import { ROUTES } from '@/lib/config/routes';
import { cn, formatCurrency } from '@/lib/utils';
import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import { ConsoleMobileList } from '@/components/console/shared/console-mobile-list';
import {
  ConsoleHeadRow,
  ConsoleRow,
  ConsoleTable,
  ConsoleTd,
  ConsoleTh,
} from '@/components/console/shared/console-table';
import { MembershipCard } from '@/features/memberships/ui/components/membership-card';
import { StatusBadge } from '@/components/console/shared/status-badge';
import {
  EXPIRY_WINDOW_DAYS,
  formatCoverageNote,
  formatMembershipPhase,
  getMembershipPhase,
  getMembershipPhaseTone,
  isExpiringSoon,
} from '@/features/memberships/shared/membership-status';
import { formatDisplayDate, todayIsoDate } from '@/lib/utils/iso-date';
import { TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';

type MembershipRow = MembershipsListPayload['items'][number];

/**
 * What the subscription still owes, beside what it grants.
 *
 * The label carries the amount only — the term count is already on the terms
 * chip, and "over 6 terms" was the widest thing in the row while adding
 * nothing a click did not. The badge itself is hollow: see `SettlementBadge`.
 */
function SettlementSummary({ settlement }: { settlement: ChainSettlement }) {
  if (settlement.termCount === 0) return null;

  return <SettlementBadge state={settlement.state}>{settlementLabel(settlement)}</SettlementBadge>;
}

function settlementLabel(settlement: ChainSettlement): string {
  if (settlement.state === 'paid') return 'Paid';
  if (settlement.state === 'unbilled') return `${settlement.unbilledCount} unbilled`;

  return `${formatAmountOwed(settlement.amountOwed, settlement.currencyCode)} owed`;
}

export function MembershipsConsole({
  canManage,
  customerId,
  initialData,
}: {
  /** False for accountants: renew, cancel and create are admin mutations. */
  canManage: boolean;
  customerId?: string;
  initialData: MembershipsListPayload;
}) {
  const [cancelMembershipId, setCancelMembershipId] = useState<string | null>(null);
  const [expandedChainId, setExpandedChainId] = useState<string | null>(null);
  const [renewTarget, setRenewTarget] = useState<MembershipRow | null>(null);
  const [summaryTarget, setSummaryTarget] = useState<MembershipRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isFetching } = useMemberships(initialData, customerId);
  const cancelMutation = useCancelMembership();
  const createMutation = useCreateMembership();
  const renewMutation = useRenewMembership();
  const customerNames = labelsById(data.customers);
  const planNames = labelsById(data.plans);
  const planMap = new Map(data.plans.map((plan) => [plan.id, plan]));
  const customerOptions = activeOnly(data.customers);
  const planOptions = activeOnly(data.plans);
  const activeServiceIds = new Set(data.activeServiceIds);
  const renewPlan = renewTarget === null ? undefined : planMap.get(renewTarget.planId);
  // Renewing six months writes six rows; the ledger reads them as one
  // subscription and keeps the individual terms a click away.
  const chains = buildMembershipChains(data.items);
  // The tiles count subscriptions, not terms, or a customer who paid six
  // months ahead would read as six active members and six renewals to chase.
  // "Active" means covered today — derived from the chain's dates, because a
  // term paid in advance carries a future start date.
  const chainPhase = (chain: (typeof chains)[number]) =>
    getMembershipPhase(
      chain.current.status,
      chain.coverageStart,
      chain.coverageEnd,
      undefined,
      chain.current.isRecurring
    );
  // An unpaid renewal is still a subscription in force, so it belongs in the
  // Active tile; the ledger badge spells out the payment problem.
  const activeCount = chains.filter((chain) => {
    const phase = chainPhase(chain);

    return phase === 'active' || phase === 'unpaid';
  }).length;
  const cancelledCount = chains.filter((chain) => chainPhase(chain) === 'cancelled').length;
  const expiringCount = chains.filter((chain) =>
    isExpiringSoon(chain.coverageEnd, chainPhase(chain))
  ).length;
  const recurringCount = chains.filter((chain) => chain.current.isRecurring).length;
  // Opening the newest term of a chain is opening the subscription, so the
  // sheet answers for every term it covers. Opening an older term from the
  // expanded list is a question about that term alone.
  const summaryChain =
    summaryTarget === null
      ? null
      : (chains.find((entry) => entry.id === summaryTarget.id && entry.termCount > 1) ?? null);
  const summaryTerms =
    summaryChain === null ? (summaryTarget === null ? [] : [summaryTarget]) : summaryChain.terms;
  const summaryIds = new Set(summaryTerms.map((term) => term.id));
  const summaryPendingPayments =
    summaryTarget === null
      ? []
      : data.pendingPayments.filter((payment) => summaryIds.has(payment.membershipId));
  const summarySettlement =
    summaryTarget === null ? null : getChainSettlement(summaryTerms, data.payments);
  // One view per subscription, shared by the ledger row and the phone card, so
  // the two renderings cannot disagree about a phase, a date or an amount.
  const views = chains.map((chain) => {
    const row = chain.current;
    const plan = planMap.get(row.planId);
    const phase = chainPhase(chain);

    return {
      chain,
      coverageNote: formatCoverageNote(chain.coverageEnd, phase),
      customerName: customerNames.get(row.customerId) ?? 'Unknown customer',
      pending:
        (cancelMutation.isPending && cancelMutation.variables === row.id) ||
        (renewMutation.isPending && renewMutation.variables?.id === row.id),
      phase,
      plan,
      planName: plan?.name ?? 'Unknown plan',
      row,
      canRenew:
        row.status !== 'cancelled' &&
        plan !== undefined &&
        plan.isActive &&
        (plan.serviceId === null || activeServiceIds.has(plan.serviceId)),
      settlement: getChainSettlement(chain.terms, data.payments),
    };
  });
  const planMeta = (plan: (typeof data.plans)[number] | undefined) =>
    plan === undefined
      ? null
      : `${formatCurrency(Number.parseFloat(plan.price), plan.currencyCode)} / ${plan.durationMonths} month${plan.durationMonths === 1 ? '' : 's'}`;
  return (
    <>
      <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <ConsoleMetric label="Active" tone="positive" value={String(activeCount)} />
        <ConsoleMetric
          label={`Expiring in ${EXPIRY_WINDOW_DAYS.caution}d`}
          tone="caution"
          value={String(expiringCount)}
        />
        <ConsoleMetric label="Cancelled" tone="critical" value={String(cancelledCount)} />
        <ConsoleMetric label="Recurring" value={String(recurringCount)} />
      </section>

      {customerId === undefined ? null : (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-(--sm-gold-b) bg-(--sm-gold-s) px-4 py-2.5 text-sm text-(--sm-gold-t)">
          <Filter className="size-3.5 shrink-0" />
          <span className="flex-1">
            Showing memberships for{' '}
            <span className="font-medium text-(--sm-fg)">
              {customerNames.get(customerId) ?? 'selected customer'}
            </span>
          </span>
          <Link
            href={ROUTES.console.memberships}
            className="inline-flex items-center gap-1 text-xs font-medium text-(--sm-muted) hover:text-(--sm-fg)"
          >
            <X className="size-3" />
            Clear filter
          </Link>
        </div>
      )}
      <section className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-(--sm-muted)">
            <CalendarClock className="size-4" />
            <span>
              {chains.length} subscription{chains.length === 1 ? '' : 's'} · {data.total} term
              {data.total === 1 ? '' : 's'} · {isFetching ? 'Refreshing…' : 'Updated just now'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* The rows say what is owed; this is the way to go and collect. */}
            <Link
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}
              href={ROUTES.console.payments}
            >
              <Wallet className="size-4" />
              Payments
            </Link>
            {canManage ? (
              <Button variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                New membership
              </Button>
            ) : null}
          </div>
        </div>

        <div className="hidden md:block">
          <ConsoleTable>
            <TableHeader>
              <ConsoleHeadRow>
                <ConsoleTh>Customer</ConsoleTh>
                <ConsoleTh>Plan</ConsoleTh>
                {/* Start and end answer different questions — when cover began,
                  when it runs out — and a single span column made the reader
                  parse a range to find one date. */}
                <ConsoleTh>Start</ConsoleTh>
                <ConsoleTh>End</ConsoleTh>
                <ConsoleTh>Status</ConsoleTh>
                <ConsoleTh className="text-right">Actions</ConsoleTh>
              </ConsoleHeadRow>
            </TableHeader>
            <TableBody>
              {views.map((view) => {
                const { chain, coverageNote, customerName, pending, phase, plan, planName, row } =
                  view;
                const isExpanded = expandedChainId === chain.id;

                return (
                  <Fragment key={chain.id}>
                    <ConsoleRow
                      className={cn('cursor-pointer', isExpanded && 'border-b-0')}
                      onClick={() => setSummaryTarget(row)}
                    >
                      <ConsoleTd>
                        <Button
                          className="h-auto justify-start p-0 text-sm font-semibold text-(--sm-fg) hover:underline"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSummaryTarget(row);
                          }}
                          type="button"
                          variant="link"
                        >
                          {customerName}
                        </Button>
                      </ConsoleTd>
                      <ConsoleTd>
                        <p className="text-sm text-(--sm-fg)">{planName}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-(--sm-muted)">
                          {planMeta(plan) === null ? null : `${planMeta(plan)} · `}
                          {row.isRecurring ? 'Recurring' : 'One-off'}
                          {chain.termCount > 1 ? (
                            <Button
                              aria-expanded={isExpanded}
                              className="h-auto gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedChainId(isExpanded ? null : chain.id);
                              }}
                              size="sm"
                              type="button"
                              variant="info"
                            >
                              {isExpanded ? 'Hide terms' : `${chain.termCount} terms`}
                              <ChevronDown
                                className={cn(
                                  'size-3 transition-transform',
                                  isExpanded && 'rotate-180'
                                )}
                              />
                            </Button>
                          ) : null}
                        </p>
                      </ConsoleTd>
                      <ConsoleTd className="text-sm text-(--sm-muted) tabular-nums">
                        {formatDisplayDate(chain.coverageStart) || chain.coverageStart}
                      </ConsoleTd>
                      <ConsoleTd>
                        <p className="text-sm text-(--sm-fg) tabular-nums">
                          {formatDisplayDate(chain.coverageEnd) || chain.coverageEnd}
                        </p>
                        {coverageNote === null ? null : (
                          <p
                            className={cn(
                              'mt-0.5 text-xs tabular-nums',
                              phase === 'expired' ? 'text-(--sm-muted)' : 'text-(--sm-gold-t)'
                            )}
                          >
                            {coverageNote}
                          </p>
                        )}
                      </ConsoleTd>
                      <ConsoleTd>
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge tone={getMembershipPhaseTone(phase)}>
                            {formatMembershipPhase(phase)}
                          </StatusBadge>
                          <SettlementSummary settlement={view.settlement} />
                        </div>
                      </ConsoleTd>
                      <ConsoleTd onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {canManage ? (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={row.status !== 'active' || pending}
                                onClick={() => setCancelMembershipId(row.id)}
                              >
                                <XCircle className="size-3.5" />
                                Cancel
                              </Button>
                              <Button
                                variant="positive"
                                size="sm"
                                disabled={!view.canRenew || pending}
                                title={view.canRenew ? undefined : 'Plan or service is inactive'}
                                onClick={() => setRenewTarget(row)}
                              >
                                <RefreshCw className="size-3.5" />
                                Renew
                              </Button>
                            </>
                          ) : null}
                          <WithTooltip label="View membership detail">
                            <Link
                              href={ROUTES.console.membershipDetail(row.id)}
                              className="inline-flex size-8 items-center justify-center rounded-md border border-(--sm-border2) text-(--sm-muted) hover:bg-(--sm-ghost-hover) hover:text-(--sm-fg)"
                              aria-label="View membership detail"
                            >
                              <ExternalLink className="size-3.5" />
                            </Link>
                          </WithTooltip>
                        </div>
                      </ConsoleTd>
                    </ConsoleRow>

                    {isExpanded ? (
                      <ConsoleRow className="hover:bg-transparent">
                        <ConsoleTd className="pt-0" colSpan={6}>
                          <MembershipChainTerms
                            onOpenTermAction={setSummaryTarget}
                            payments={data.payments}
                            terms={chain.terms}
                          />
                        </ConsoleTd>
                      </ConsoleRow>
                    ) : null}
                  </Fragment>
                );
              })}

              {data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <ConsoleEmptyState
                      bordered={false}
                      title="No memberships yet"
                      description="Create a membership to start tracking its lifecycle."
                    />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </ConsoleTable>
        </div>

        <ConsoleMobileList>
          {views.map((view) => {
            const isExpanded = expandedChainId === view.chain.id;

            return (
              <MembershipCard
                key={view.chain.id}
                canManage={canManage}
                canRenew={view.canRenew}
                coverageEnd={view.chain.coverageEnd}
                coverageStart={view.chain.coverageStart}
                customerName={view.customerName}
                detailHref={ROUTES.console.membershipDetail(view.row.id)}
                isExpanded={isExpanded}
                isRecurring={view.row.isRecurring}
                onCancel={() => setCancelMembershipId(view.row.id)}
                onOpen={() => setSummaryTarget(view.row)}
                onRenew={() => setRenewTarget(view.row)}
                onToggleTerms={() => setExpandedChainId(isExpanded ? null : view.chain.id)}
                payments={data.payments}
                pending={view.pending}
                phase={view.phase}
                planMeta={planMeta(view.plan)}
                planName={view.planName}
                settlement={view.settlement}
                termCount={view.chain.termCount}
                terms={view.chain.terms}
              />
            );
          })}
          {data.items.length === 0 ? (
            <ConsoleEmptyState
              title="No memberships yet"
              description="Create a membership to start tracking its lifecycle."
            />
          ) : null}
        </ConsoleMobileList>
      </section>

      <MembershipCreateForm
        customerOptions={customerOptions}
        isPending={createMutation.isPending}
        onOpenChangeAction={setCreateOpen}
        onSubmitAction={(values) => {
          createMutation.mutate(values, {
            onSuccess: () => {
              setCreateOpen(false);
              toast.success('Membership created', {
                description: `${customerNames.get(values.customerId) ?? 'Unknown customer'} · ${planNames.get(values.planId) ?? 'Unknown plan'}`,
              });
            },
          });
        }}
        open={createOpen}
        planOptions={planOptions}
      />

      <ConfirmActionDialog
        cancelLabel="Keep membership"
        confirmLabel="Cancel membership"
        description="This ends the membership immediately. Future charges are cancelled; anything already due stays owed in the ledger."
        details={
          <PendingPaymentsList
            payments={data.pendingPayments.filter(
              (payment) =>
                payment.membershipId === cancelMembershipId && payment.dueDate > todayIsoDate()
            )}
          />
        }
        icon={<XCircle className="size-5" />}
        onConfirm={() => {
          if (cancelMembershipId === null) return;
          cancelMutation.mutate(cancelMembershipId);
          setCancelMembershipId(null);
        }}
        onOpenChangeAction={(open) => {
          if (!open) setCancelMembershipId(null);
        }}
        open={cancelMembershipId !== null}
        pending={cancelMutation.isPending}
        title="Cancel this membership?"
        tone="destructive"
      />

      <MembershipSummarySheet
        chain={summaryChain}
        customerName={
          summaryTarget === null
            ? ''
            : (customerNames.get(summaryTarget.customerId) ?? 'Unknown customer')
        }
        membership={summaryTarget}
        onOpenChangeAction={(open) => {
          if (!open) setSummaryTarget(null);
        }}
        open={summaryTarget !== null}
        pendingPayments={summaryPendingPayments}
        settlement={summarySettlement}
        planName={
          summaryTarget === null ? '' : (planNames.get(summaryTarget.planId) ?? 'Unknown plan')
        }
      />

      {renewTarget === null ? null : (
        <RenewMembershipDialog
          customerName={customerNames.get(renewTarget.customerId) ?? 'This customer'}
          endDate={renewTarget.endDate}
          isPending={renewMutation.isPending}
          onConfirmAction={({ markPaid, paidDate, terms }) => {
            renewMutation.mutate(
              { id: renewTarget.id, markPaid, paidDate, terms },
              {
                onSuccess: () =>
                  toast.success('Membership renewed', {
                    description: `${terms} term${terms === 1 ? '' : 's'}${markPaid ? ' · settled now' : ''}`,
                  }),
              }
            );
            setRenewTarget(null);
          }}
          onOpenChangeAction={(open) => {
            if (!open) setRenewTarget(null);
          }}
          open
          plan={
            renewPlan === undefined
              ? null
              : {
                  currencyCode: renewPlan.currencyCode,
                  durationMonths: renewPlan.durationMonths,
                  name: renewPlan.name,
                  price: renewPlan.price,
                }
          }
        />
      )}
    </>
  );
}
