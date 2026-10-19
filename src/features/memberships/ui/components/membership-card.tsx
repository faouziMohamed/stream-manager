'use client';

import { ChevronDown, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
import Link from 'next/link';

import {
  ConsoleMobileActions,
  ConsoleMobileCard,
  ConsoleMobileCardHeader,
  ConsoleMobileFact,
} from '@/components/console/shared/console-mobile-list';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { Button } from '@/components/ui/button';
import { MembershipChainTerms } from '@/features/memberships/ui/components/membership-chain-terms';
import { SettlementBadge } from '@/features/memberships/ui/components/settlement-badge';
import {
  formatAmountOwed,
  type ChainSettlement,
} from '@/features/memberships/shared/membership-settlement';
import {
  formatCoverageNote,
  formatMembershipPhase,
  getMembershipPhaseTone,
  type MembershipPhase,
} from '@/features/memberships/shared/membership-status';
import type { MembershipsListPayload } from '@/features/memberships/ui/queries/use-memberships.queries';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';

type MembershipRow = MembershipsListPayload['items'][number];

/**
 * One subscription on a phone: the same facts the ledger row carries, stacked
 * instead of scrolled. Start and end stay two labelled values — the table's
 * two columns are what a reader compares, and merging them into a range makes
 * one date out of two.
 */
export function MembershipCard({
  canManage,
  canRenew,
  coverageEnd,
  coverageStart,
  customerName,
  detailHref,
  isExpanded,
  isRecurring,
  onCancel,
  onOpen,
  onRenew,
  onToggleTerms,
  payments,
  pending,
  phase,
  planMeta,
  planName,
  settlement,
  termCount,
  terms,
}: MembershipCardProps) {
  const coverageNote = formatCoverageNote(coverageEnd, phase);
  const canCancel =
    phase === 'active' || phase === 'upcoming' || phase === 'expired' || phase === 'unpaid';

  return (
    <ConsoleMobileCard onClick={onOpen}>
      <ConsoleMobileCardHeader>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-(--sm-fg)">{customerName}</p>
          <p className="mt-0.5 truncate text-xs text-(--sm-muted)">{planName}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge tone={getMembershipPhaseTone(phase)}>
            {formatMembershipPhase(phase)}
          </StatusBadge>
          {settlement.termCount === 0 ? null : (
            <SettlementBadge state={settlement.state}>
              {settlementLabel(settlement)}
            </SettlementBadge>
          )}
        </div>
      </ConsoleMobileCardHeader>

      <div className="mt-3 grid gap-1.5">
        <ConsoleMobileFact
          label="Start"
          value={formatDisplayDate(coverageStart) || coverageStart}
        />
        <ConsoleMobileFact
          label="End"
          value={
            <>
              {formatDisplayDate(coverageEnd) || coverageEnd}
              {coverageNote === null ? null : (
                <span
                  className={cn(
                    'mt-0.5 block text-xs tabular-nums',
                    phase === 'expired' ? 'text-(--sm-muted)' : 'text-(--sm-gold-t)'
                  )}
                >
                  {coverageNote}
                </span>
              )}
            </>
          }
        />
      </div>

      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-(--sm-muted)">
        {planMeta === null ? null : `${planMeta} · `}
        {isRecurring ? 'Recurring' : 'One-off'}
        {termCount > 1 ? (
          <Button
            aria-expanded={isExpanded}
            className="h-auto gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            onClick={(event) => {
              event.stopPropagation();
              onToggleTerms();
            }}
            size="sm"
            type="button"
            variant="info"
          >
            {isExpanded ? 'Hide terms' : `${termCount} terms`}
            <ChevronDown
              className={cn('size-3 transition-transform', isExpanded && 'rotate-180')}
            />
          </Button>
        ) : null}
      </p>

      <ConsoleMobileActions>
        {canManage ? (
          <>
            <Button
              disabled={!canCancel || pending}
              onClick={(event) => {
                event.stopPropagation();
                onCancel();
              }}
              size="sm"
              variant="destructive"
            >
              <XCircle className="size-3.5" />
              Cancel
            </Button>
            <Button
              disabled={!canRenew || pending}
              onClick={(event) => {
                event.stopPropagation();
                onRenew();
              }}
              size="sm"
              variant="positive"
            >
              <RefreshCw className="size-3.5" />
              Renew
            </Button>
          </>
        ) : null}
        <Link
          aria-label="View membership detail"
          className="ml-auto inline-flex size-8 items-center justify-center rounded-md border border-(--sm-border2) text-(--sm-muted) hover:bg-(--sm-ghost-hover) hover:text-(--sm-fg)"
          href={detailHref}
          onClick={(event) => event.stopPropagation()}
        >
          <ExternalLink className="size-3.5" />
        </Link>
      </ConsoleMobileActions>

      {isExpanded ? (
        <div className="mt-3" onClick={(event) => event.stopPropagation()}>
          <MembershipChainTerms onOpenTermAction={onOpen} payments={payments} terms={terms} />
        </div>
      ) : null}
    </ConsoleMobileCard>
  );
}

function settlementLabel(settlement: ChainSettlement): string {
  if (settlement.state === 'paid') return 'Paid';
  if (settlement.state === 'unbilled') return `${settlement.unbilledCount} unbilled`;

  return `${formatAmountOwed(settlement.amountOwed, settlement.currencyCode)} owed`;
}

type MembershipCardProps = {
  /** Renew and cancel are admin mutations; accountants only read. */
  canManage: boolean;
  canRenew: boolean;
  coverageEnd: string;
  coverageStart: string;
  customerName: string;
  detailHref: string;
  isExpanded: boolean;
  isRecurring: boolean;
  onCancel: () => void;
  onOpen: () => void;
  onRenew: () => void;
  onToggleTerms: () => void;
  payments: MembershipsListPayload['payments'];
  pending: boolean;
  phase: MembershipPhase;
  planMeta: string | null;
  planName: string;
  settlement: ChainSettlement;
  termCount: number;
  terms: MembershipRow[];
};
