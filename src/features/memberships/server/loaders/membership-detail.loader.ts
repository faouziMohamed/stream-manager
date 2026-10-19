import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import { loadAllPages } from '@/lib/graphql/load-all-pages';
import {
  GetMembershipDocument,
  type GetMembershipQuery,
  type GetMembershipQueryVariables,
  ListMembershipCustomerOptionsDocument,
  type ListMembershipCustomerOptionsQuery,
  type ListMembershipCustomerOptionsQueryVariables,
  ListMembershipsDocument,
  type ListMembershipsQuery,
  type ListMembershipsQueryVariables,
  ListMembershipPlanOptionsDocument,
  type ListMembershipPlanOptionsQuery,
  type ListMembershipPlanOptionsQueryVariables,
  ListPaymentsDocument,
  type ListPaymentsQuery,
  type ListPaymentsQueryVariables,
  ListServicesDocument,
  type ListServicesQuery,
  type ListServicesQueryVariables,
  ListStreamingAccountsDocument,
  type ListStreamingAccountsQuery,
  type ListStreamingAccountsQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { buildMembershipChains } from '@/features/memberships/shared/membership-chains.mapper';
import {
  buildMembershipActivity,
  type MembershipActivityEvent,
} from '@/features/memberships/shared/membership-activity.mapper';
import { createLogger } from '@/lib/logger';

const log = createLogger('membership-detail.loader');

export type MembershipDetailDto = NonNullable<GetMembershipQuery['membership']>;
export type MembershipDetailCustomer =
  ListMembershipCustomerOptionsQuery['customers']['items'][number];
export type MembershipDetailPlan = ListMembershipPlanOptionsQuery['plans']['items'][number];
export type MembershipDetailPayment = ListPaymentsQuery['payments']['items'][number];

export type MembershipDetailPayload = {
  /** Every event that ever happened to this subscription, newest first. */
  activities: MembershipActivityEvent[];
  canRenew: boolean;
  /** The whole renewal chain this term belongs to, newest term first. */
  chain: MembershipChainSummary;
  customer: MembershipDetailCustomer | null;
  membership: MembershipDetailDto | null;
  /** Every payment across the chain, newest due date first. */
  payments: MembershipDetailPayment[];
  plan: MembershipDetailPlan | null;
};

export type MembershipChainSummary = {
  coverageEnd: string;
  coverageStart: string;
  termCount: number;
  termIds: string[];
};

const emptyPayload: MembershipDetailPayload = {
  activities: [],
  canRenew: false,
  chain: { coverageEnd: '', coverageStart: '', termCount: 0, termIds: [] },
  customer: null,
  membership: null,
  payments: [],
  plan: null,
};

export async function loadMembershipDetail(id: string): Promise<MembershipDetailPayload> {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    log.warn('No session when loading membership detail');
    return emptyPayload;
  }

  const membership = await gqlRequest<GetMembershipQuery, GetMembershipQueryVariables>(
    GetMembershipDocument,
    { id }
  ).then((r) => r.membership ?? null);

  if (membership === null) return emptyPayload;

  const [customers, plans, payments, services, allMemberships, accounts] = await Promise.all([
    loadAllPages(async (page, pageSize) => {
      const r = await gqlRequest<
        ListMembershipCustomerOptionsQuery,
        ListMembershipCustomerOptionsQueryVariables
      >(ListMembershipCustomerOptionsDocument, { page, pageSize });
      return r.customers;
    }),
    loadAllPages(async (page, pageSize) => {
      const r = await gqlRequest<
        ListMembershipPlanOptionsQuery,
        ListMembershipPlanOptionsQueryVariables
      >(ListMembershipPlanOptionsDocument, { isActive: null, page, pageSize });
      return r.plans;
    }),
    loadAllPages(async (page, pageSize) => {
      const r = await gqlRequest<ListPaymentsQuery, ListPaymentsQueryVariables>(
        ListPaymentsDocument,
        { dueFrom: null, dueTo: null, order: null, page, pageSize, status: null }
      );
      return r.payments;
    }),
    loadAllPages(async (page, pageSize) => {
      const r = await gqlRequest<ListServicesQuery, ListServicesQueryVariables>(
        ListServicesDocument,
        { page, pageSize }
      );
      return r.services;
    }),
    // The chain is only walkable across the whole set: a renewal points
    // backwards, and the term being viewed may be the middle of eight.
    loadAllPages(async (page, pageSize) => {
      const r = await gqlRequest<ListMembershipsQuery, ListMembershipsQueryVariables>(
        ListMembershipsDocument,
        { customerId: null, page, pageSize }
      );
      return r.memberships;
    }),
    gqlRequest<ListStreamingAccountsQuery, ListStreamingAccountsQueryVariables>(
      ListStreamingAccountsDocument,
      {}
    ),
  ]);

  const chain = buildMembershipChains(allMemberships.items).find((entry) =>
    entry.terms.some((term) => term.id === membership.id)
  );
  const chainTerms = chain?.terms ?? [];
  const chainIds = new Set(chainTerms.map((term) => term.id));

  const plan = plans.items.find((p) => p.id === membership.planId) ?? null;
  const activeServiceIds = new Set(services.items.filter((s) => s.isActive).map((s) => s.id));
  const canRenew =
    plan !== null &&
    plan.isActive &&
    (plan.serviceId === null || activeServiceIds.has(plan.serviceId));

  const chainPayments = payments.items
    .filter((payment) => chainIds.has(payment.membershipId))
    .toSorted((left, right) => right.dueDate.localeCompare(left.dueDate));

  const assignments = accounts.streamingAccounts.flatMap((account) =>
    (account.profiles ?? [])
      .filter(
        (profile): profile is typeof profile & { assignedAt: string; membershipId: string } =>
          profile.assignedAt !== null &&
          profile.membershipId !== null &&
          chainIds.has(profile.membershipId)
      )
      .map((profile) => ({
        accountLabel: account.label,
        assignedAt: profile.assignedAt,
        id: profile.assignmentId ?? profile.id,
        profileName: profile.name,
      }))
  );

  const activities = buildMembershipActivity({
    assignments,
    payments: chainPayments,
    terms: chainTerms,
  });

  return {
    activities,
    canRenew,
    chain: {
      coverageEnd: chain?.coverageEnd ?? membership.endDate,
      coverageStart: chain?.coverageStart ?? membership.startDate,
      termCount: chain?.termCount ?? 1,
      termIds: [...chainIds],
    },
    customer: customers.items.find((c) => c.id === membership.customerId) ?? null,
    membership,
    payments: chainPayments,
    plan,
  };
}
