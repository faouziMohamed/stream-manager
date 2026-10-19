import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { WithTooltip } from '@/components/console/shared/with-tooltip';
import {
  type ExpiryUrgency,
  formatExpiryCountdown,
  formatMembershipPhase,
  getExpiryUrgency,
  getMembershipPhaseTone,
  type MembershipPhase,
} from '@/features/memberships/shared/membership-status';
import type { StreamingAccountHolder } from '@/features/streaming-accounts/shared/streaming-account-stats.mapper';
import { ROUTES } from '@/lib/config/routes';
import { formatCurrency } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

/**
 * Who is sitting on this account's profiles.
 *
 * The profile names mean nothing on their own — "Profile 2" is not a person —
 * so each row reads profile → customer → plan → how far the cover is paid, and
 * the deadline wears the same tones as the membership ledger.
 */
export function StreamingAccountAssignments({ holders }: { holders: StreamingAccountHolder[] }) {
  if (holders.length === 0) {
    return (
      <ConsoleEmptyState
        description="Assign a profile to a membership and the holder appears here."
        title="No profile is assigned yet"
      />
    );
  }

  return (
    <ul className="divide-y divide-(--sm-border) overflow-hidden rounded-xl border border-(--sm-border) bg-(--sm-surface)">
      {holders.map((holder) => {
        const urgency =
          holder.endDate === undefined ? 'none' : getExpiryUrgency(holder.endDate, holder.phase);
        const countdown =
          holder.endDate === undefined ? null : formatExpiryCountdown(holder.endDate, holder.phase);
        // The date is the cover's end, so what it means depends on the phase:
        // "ended" for a lapsed holder, "ends in N days" for a current one.
        const dateNote = coverNote(holder.phase, countdown);

        return (
          <li
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
            key={holder.profileId}
          >
            <StatusBadge tone="neutral">{holder.profileName}</StatusBadge>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-(--sm-fg)">{holder.customerName}</p>
              <p className="truncate text-xs text-(--sm-muted)">
                {holder.planName ?? 'Unknown plan'}
                {holder.monthlyPrice === undefined
                  ? ''
                  : ` · ${formatCurrency(holder.monthlyPrice, holder.currencyCode ?? DEFAULT_CURRENCY)} / month`}
              </p>
            </div>

            <StatusBadge tone={getMembershipPhaseTone(holder.phase)}>
              {formatMembershipPhase(holder.phase)}
            </StatusBadge>

            {holder.endDate === undefined ? null : (
              <div className="text-right">
                <p className={coverDateClass(holder.phase, urgency)}>
                  {formatDisplayDate(holder.endDate) || holder.endDate}
                </p>
                <p className="text-xs text-(--sm-muted)">{dateNote}</p>
              </div>
            )}

            <WithTooltip label="Open this membership">
              <Link
                aria-label={`Open the membership held by ${holder.customerName}`}
                className="inline-flex size-8 items-center justify-center rounded-md border border-(--sm-border2) text-(--sm-muted) hover:bg-(--sm-ghost-hover) hover:text-(--sm-fg)"
                href={ROUTES.console.membershipDetail(holder.membershipId)}
              >
                <ExternalLink className="size-3.5" />
              </Link>
            </WithTooltip>
          </li>
        );
      })}
    </ul>
  );
}

function coverNote(phase: MembershipPhase, countdown: string | null): string {
  if (phase === 'expired') return 'cover ended';
  if (phase === 'unpaid') return 'renewal unpaid';
  if (phase === 'upcoming') return 'not started yet';

  return countdown ?? 'cover current';
}

function coverDateClass(phase: MembershipPhase, urgency: ExpiryUrgency): string {
  if (phase === 'expired' || phase === 'unpaid') {
    return 'text-sm font-semibold text-(--sm-coral-t) tabular-nums';
  }

  if (urgency === 'caution') return 'text-sm font-semibold text-(--sm-gold-t) tabular-nums';

  return 'text-sm text-(--sm-fg) tabular-nums';
}
