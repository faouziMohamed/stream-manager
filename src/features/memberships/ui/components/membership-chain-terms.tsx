'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { StatusBadge } from '@/components/console/shared/status-badge';
import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { Button } from '@/components/ui/button';
import {
  formatAmountOwed,
  getTermSettlement,
  type SettlementPayment,
} from '@/features/memberships/shared/membership-settlement';
import { SettlementBadge } from '@/features/memberships/ui/components/settlement-badge';
import {
  formatMembershipPhase,
  getMembershipPhase,
  getMembershipPhaseTone,
} from '@/features/memberships/shared/membership-status';
import type { MembershipsListPayload } from '@/features/memberships/ui/queries/use-memberships.queries';
import { ROUTES } from '@/lib/config/routes';
import { formatDisplayDate } from '@/lib/utils/iso-date';

type MembershipRow = MembershipsListPayload['items'][number];

/**
 * The individual terms behind a collapsed subscription row.
 *
 * Numbered from the start of the chain rather than by position in the list, so
 * "term 1" is the month the customer first paid for and stays term 1 as later
 * renewals push it down.
 */
export function MembershipChainTerms({
  onOpenTermAction,
  payments,
  terms,
}: MembershipChainTermsProps) {
  return (
    <ol className="divide-y divide-(--sm-border) overflow-hidden rounded-lg border border-(--sm-border) bg-(--sm-bg)">
      {terms.map((term, index) => {
        const phase = getMembershipPhase(term.status, term.startDate, term.endDate);

        return (
          <li
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5 text-sm hover:bg-(--sm-hover)"
            key={term.id}
          >
            <span className="w-14 shrink-0 text-xs text-(--sm-muted) tabular-nums">
              Term {terms.length - index}
            </span>
            <Button
              className="h-auto justify-start p-0 text-sm font-medium text-(--sm-fg) tabular-nums hover:underline"
              onClick={() => onOpenTermAction(term)}
              type="button"
              variant="link"
            >
              {term.businessId}
            </Button>
            <span className="flex-1 text-(--sm-muted) tabular-nums">
              {formatDisplayDate(term.startDate) || term.startDate} →{' '}
              {formatDisplayDate(term.endDate) || term.endDate}
            </span>
            {/* Two facts, two badges: whether they can watch, and whether they
              paid. One badge would have to pick a winner, and the row an
              operator must act on is precisely the one where they disagree.
              The first is read from the term's dates, not its stored word. */}
            <StatusBadge tone={getMembershipPhaseTone(phase)}>
              {formatMembershipPhase(phase)}
            </StatusBadge>
            <TermSettlementBadge payments={payments} term={term} />
            <WithTooltip label="View this term">
              <Link
                aria-label={`View term ${terms.length - index}`}
                className="inline-flex size-7 items-center justify-center rounded-md border border-(--sm-border2) text-(--sm-muted) hover:bg-(--sm-ghost-hover) hover:text-(--sm-fg)"
                href={ROUTES.console.membershipDetail(term.id)}
              >
                <ExternalLink className="size-3" />
              </Link>
            </WithTooltip>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Settled or not, in the same words the rest of the console uses.
 *
 * A cancelled term shows nothing: its payments were cancelled with it, so the
 * money question does not exist and a badge would have to invent an answer.
 */
function TermSettlementBadge({
  payments,
  term,
}: {
  payments: SettlementPayment[];
  term: MembershipRow;
}) {
  if (term.status === 'cancelled') return null;

  const settlement = getTermSettlement(term.id, payments);

  return (
    <SettlementBadge state={settlement.state}>
      {settlement.state === 'paid' || settlement.state === 'unbilled'
        ? settlement.label
        : `${settlement.label} ${formatAmountOwed(settlement.amountOwed, settlement.currencyCode)}`}
    </SettlementBadge>
  );
}

type MembershipChainTermsProps = {
  onOpenTermAction: (term: MembershipRow) => void;
  /** Every payment on the page, filtered per term by the settlement helper. */
  payments: SettlementPayment[];
  /** Newest first, as `buildMembershipChains` returns them. */
  terms: MembershipRow[];
};
