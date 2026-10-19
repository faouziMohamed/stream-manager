import type { StatusTone } from '@/components/console/shared/status-badge';
import { parseIsoDate, todayIsoDate } from '@/lib/utils/iso-date';

export function formatMembershipStatus(status: string): string {
  if (status.length === 0) return 'Unknown';
  return `${status[0]?.toUpperCase() ?? ''}${status.slice(1)}`;
}

/**
 * What a subscription is *now*, which is a fact about its dates.
 *
 * The stored `status` is only authoritative for the two states a date cannot
 * express: `cancelled` and `pending`. Everything else follows from where today
 * sits between start and end: a stored word cannot notice that the next month
 * has begun, a date comparison can.
 *
 * A recurring subscription does not end with its paid term. When the term has
 * ended and no renewal followed, the subscription is still valid until it is
 * cancelled and the renewal is unpaid — `unpaid`, not `expired`. That is the
 * split subscription systems make between the subscription's lifecycle and its
 * billing health. A one-off subscription does end with its term.
 */
export function getMembershipPhase(
  status: string,
  startDate: string,
  endDate: string,
  today = todayIsoDate(),
  isRecurring = false
): MembershipPhase {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'pending') return 'pending';
  if (startDate > today) return 'upcoming';
  if (endDate < today) return isRecurring ? 'unpaid' : 'expired';

  return 'active';
}

export function formatMembershipPhase(phase: MembershipPhase): string {
  if (phase === 'active') return 'Active';
  if (phase === 'upcoming') return 'Upcoming';
  if (phase === 'expired') return 'Expired';
  if (phase === 'unpaid') return 'Renewal unpaid';
  if (phase === 'cancelled') return 'Cancelled';

  return 'Pending';
}

export function getMembershipPhaseTone(phase: MembershipPhase): StatusTone {
  if (phase === 'active') return 'positive';
  if (phase === 'upcoming') return 'caution';
  if (phase === 'unpaid') return 'caution';
  if (phase === 'cancelled') return 'critical';
  if (phase === 'pending') return 'caution';

  return 'neutral';
}

export function getMembershipStatusTone(status: string): StatusTone {
  if (status === 'active') return 'positive';
  if (status === 'cancelled') return 'critical';
  if (status === 'pending') return 'caution';
  return 'neutral';
}

// Days from today until the given end date; negative when already past.
// Returns null for unparseable dates so callers can skip emphasis.
export function daysUntilEnd(endDate: string): number | null {
  const end = parseIsoDate(endDate);
  const today = parseIsoDate(todayIsoDate());
  if (end === undefined || today === undefined) return null;
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Two windows, because they call for different work.
 *
 * Inside a week the operator has to chase the customer now, so the row shouts
 * in coral. Inside a month it is a renewal to plan for, which is gold — the
 * same split the metric tiles use, so "Expiring" on the tile and the chip on
 * the row can never disagree about what counts as soon.
 */
export const EXPIRY_WINDOW_DAYS = { caution: 30, critical: 7 } as const;

export function getExpiryUrgency(endDate: string, status: string): ExpiryUrgency {
  if (status !== 'active') return 'none';

  const days = daysUntilEnd(endDate);

  if (days === null || days < 0) return 'none';
  if (days <= EXPIRY_WINDOW_DAYS.critical) return 'critical';
  if (days <= EXPIRY_WINDOW_DAYS.caution) return 'caution';

  return 'none';
}

/**
 * What the end date means, in words — the same fact the old console put beside
 * every row and the only way a date alone stops being ambiguous.
 *
 * Only two states speak: cover that has already lapsed ("expired 7 days ago")
 * and cover about to lapse (inside the 30-day window). A term running for
 * months says nothing, because a note on every row is noise.
 */
export function formatCoverageNote(endDate: string, phase: MembershipPhase): string | null {
  const days = daysUntilEnd(endDate);

  if (days === null) return null;

  if (phase === 'expired') {
    const elapsed = Math.abs(days);

    return elapsed === 0 ? 'expired today' : `expired ${elapsed}d ago`;
  }

  // The subscription is still valid; the money is not. Say which.
  if (phase === 'unpaid') return `unpaid for ${Math.abs(days)}d`;

  if (phase !== 'active' || days > EXPIRY_WINDOW_DAYS.caution) return null;
  if (days === 0) return 'ends today';

  return `ends in ${days}d`;
}

/** The countdown in words; `null` when there is nothing to count down to. */
export function formatExpiryCountdown(endDate: string, status: string): string | null {
  if (getExpiryUrgency(endDate, status) === 'none') return null;

  const days = daysUntilEnd(endDate);

  if (days === null) return null;
  if (days === 0) return 'ends today';
  if (days === 1) return 'ends tomorrow';

  return `ends in ${days} days`;
}

export function isExpiringSoon(endDate: string, status: string): boolean {
  return getExpiryUrgency(endDate, status) !== 'none';
}

export type ExpiryUrgency = 'caution' | 'critical' | 'none';

export type MembershipPhase =
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'pending'
  | 'unpaid'
  | 'upcoming';
