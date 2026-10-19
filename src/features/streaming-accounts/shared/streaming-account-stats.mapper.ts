import {
  getMembershipPhase,
  type MembershipPhase,
} from '@/features/memberships/shared/membership-status';

/**
 * What one streaming account is actually doing for the business.
 *
 * A reseller buys a single subscription and sells its profiles, so the
 * questions are always the same three: how much of the account is sold, what
 * that earns each month, and when the next slot comes back. Capacity is the
 * created profiles or, before any exist, the slots the account is allowed —
 * otherwise a brand new account reads as fully used at 0/0.
 */
export function buildStreamingAccountStats({
  maxProfiles,
  membershipsById,
  profiles,
  today,
}: StreamingAccountStatsInput): StreamingAccountStats {
  const capacity = profiles.length > 0 ? profiles.length : maxProfiles;
  // A profile is assigned to the term it was created under, and renewals add
  // terms on top. The customer still holds the slot, so the holder is resolved
  // through the renewal chain to the term that covers them now.
  const successorByParent = buildSuccessorIndex(membershipsById);
  const holders = profiles
    .map((profile) => toHolder(profile, membershipsById, successorByParent, today))
    .filter((holder) => holder !== null);

  // Only a holder whose cover is current pays this month. Summing expired
  // holders too read as revenue that does not exist.
  const paying = holders.filter((holder) => holder.phase === 'active');
  const monthlyRevenue = paying.reduce((total, holder) => total + (holder.monthlyPrice ?? 0), 0);
  const currencyCode = holders.find((holder) => holder.currencyCode !== undefined)?.currencyCode;
  // A recurring subscription does not release its slot when a term ends — it
  // stays valid until cancelled. Only a one-off holder has a known free date.
  const nextToFree = holders
    .filter((holder) => !holder.isRecurring)
    .filter((holder) => holder.phase === 'active' || holder.phase === 'upcoming')
    .filter((holder) => holder.endDate !== undefined)
    .toSorted((left, right) => (left.endDate ?? '').localeCompare(right.endDate ?? ''))
    .at(0);

  return {
    assigned: holders.length,
    capacity,
    currencyCode,
    free: Math.max(capacity - holders.length, 0),
    holders,
    monthlyRevenue,
    nextToFree: nextToFree ?? null,
    payingCount: paying.length,
  };
}

/** parent membership id -> the term that renewed it, if one is loaded. */
function buildSuccessorIndex(
  membershipsById: Map<string, StreamingAccountHolderSource>
): Map<string, string> {
  const index = new Map<string, string>();

  for (const [id, membership] of membershipsById) {
    if (membership.renewedFromId !== null && membership.renewedFromId !== undefined) {
      index.set(membership.renewedFromId, id);
    }
  }

  return index;
}

/**
 * The assigned term plus every renewal that followed it.
 *
 * The slot belongs to the subscription, not to one month of it: a customer who
 * renewed still holds the profile, and their cover runs from the first term to
 * the last. A corrupt cycle stops at the id already seen.
 */
function collectChain(membershipId: string, successorByParent: Map<string, string>): string[] {
  const visited = new Set<string>([membershipId]);
  const chain = [membershipId];
  let current = membershipId;

  for (;;) {
    const successor = successorByParent.get(current);

    if (successor === undefined || visited.has(successor)) return chain;

    visited.add(successor);
    chain.push(successor);
    current = successor;
  }
}

/** A profile is only a holder once it points at a membership we can name. */
function toHolder(
  profile: StreamingAccountProfile,
  membershipsById: Map<string, StreamingAccountHolderSource>,
  successorByParent: Map<string, string>,
  today?: string
): StreamingAccountHolder | null {
  if (profile.membershipId === null || profile.membershipId === undefined) return null;

  const chainIds = collectChain(profile.membershipId, successorByParent);
  const tipId = chainIds.at(-1) as string;
  const tip = membershipsById.get(tipId);
  const starts = chainIds
    .map((id) => membershipsById.get(id)?.startDate)
    .filter((value): value is string => value !== undefined)
    .toSorted();
  const ends = chainIds
    .map((id) => membershipsById.get(id)?.endDate)
    .filter((value): value is string => value !== undefined)
    .toSorted();
  const startDate = starts[0];
  const endDate = ends.at(-1);

  return {
    assignmentId: profile.assignmentId ?? null,
    currencyCode: tip?.currencyCode,
    customerName: tip?.customerName ?? 'Unknown customer',
    endDate,
    isRecurring: tip?.isRecurring ?? false,
    membershipId: tipId,
    monthlyPrice: tip?.monthlyPrice,
    phase:
      startDate === undefined || endDate === undefined
        ? 'expired'
        : getMembershipPhase(
            tip?.status ?? 'active',
            startDate,
            endDate,
            today,
            tip?.isRecurring ?? false
          ),
    planName: tip?.planName,
    profileId: profile.id,
    profileName: profile.name,
  };
}

export type StreamingAccountProfile = {
  assignmentId?: string | null;
  id: string;
  isAssigned?: boolean;
  membershipId?: string | null;
  name: string;
};

export type StreamingAccountHolderSource = {
  currencyCode?: string;
  customerName?: string;
  endDate?: string;
  isRecurring?: boolean;
  monthlyPrice?: number;
  planName?: string;
  /** The term this one renewed; used to follow the chain to the newest term. */
  renewedFromId?: string | null;
  startDate?: string;
  status?: string;
};

export type StreamingAccountHolder = {
  assignmentId: string | null;
  currencyCode?: string;
  customerName: string;
  endDate?: string;
  /** The subscription renews, so its slot returns only on cancellation. */
  isRecurring: boolean;
  membershipId: string;
  monthlyPrice?: number;
  /** Whether the holder's cover is current, ahead, or already over. */
  phase: MembershipPhase;
  planName?: string;
  profileId: string;
  profileName: string;
};

export type StreamingAccountStats = {
  assigned: number;
  capacity: number;
  /** From the first holder that names one; accounts are single-currency. */
  currencyCode?: string;
  free: number;
  holders: StreamingAccountHolder[];
  /** What the holders whose cover is current pay each month. */
  monthlyRevenue: number;
  /** The holder whose cover ends first, or `null` when none is dated. */
  nextToFree: StreamingAccountHolder | null;
  /** Holders whose cover covers today. */
  payingCount: number;
};

type StreamingAccountStatsInput = {
  maxProfiles: number;
  membershipsById: Map<string, StreamingAccountHolderSource>;
  profiles: StreamingAccountProfile[];
  /** Injectable for tests; defaults to today in the phase helper. */
  today?: string;
};
