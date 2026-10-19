import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import { loadAllPages } from '@/lib/graphql/load-all-pages';
import {
  ListMembershipCustomerOptionsDocument,
  type ListMembershipCustomerOptionsQuery,
  type ListMembershipCustomerOptionsQueryVariables,
  ListMembershipPlanOptionsDocument,
  type ListMembershipPlanOptionsQuery,
  type ListMembershipPlanOptionsQueryVariables,
  ListStreamingAccountMembershipOptionsDocument,
  type ListStreamingAccountMembershipOptionsQuery,
  type ListStreamingAccountMembershipOptionsQueryVariables,
  ListStreamingAccountServiceOptionsDocument,
  type ListStreamingAccountServiceOptionsQuery,
  type ListStreamingAccountServiceOptionsQueryVariables,
  ListStreamingAccountsDocument,
  type ListStreamingAccountsQuery,
  type ListStreamingAccountsQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('streaming-accounts.loader');

type StreamingAccountListItem = ListStreamingAccountsQuery['streamingAccounts'][number];
type MembershipOption = ListStreamingAccountMembershipOptionsQuery['memberships']['items'][number];
type ServiceOption = ListStreamingAccountServiceOptionsQuery['services']['items'][number];

type StreamingAccountListPayload = {
  items: StreamingAccountListItem[];
  membershipOptions: MembershipOption[];
  serviceOptions: ServiceOption[];
  total: number;
};

export async function loadStreamingAccounts(): Promise<StreamingAccountListPayload> {
  const empty: StreamingAccountListPayload = {
    items: [],
    membershipOptions: [],
    serviceOptions: [],
    total: 0,
  };

  try {
    const session = await auth();

    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading streaming accounts');
      return empty;
    }

    const [data, customers, plans, memberships, services] = await Promise.all([
      gqlRequest<ListStreamingAccountsQuery, ListStreamingAccountsQueryVariables>(
        ListStreamingAccountsDocument,
        {}
      ),
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<
          ListMembershipCustomerOptionsQuery,
          ListMembershipCustomerOptionsQueryVariables
        >(ListMembershipCustomerOptionsDocument, { page, pageSize });
        return response.customers;
      }),
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<
          ListMembershipPlanOptionsQuery,
          ListMembershipPlanOptionsQueryVariables
        >(ListMembershipPlanOptionsDocument, { isActive: true, page, pageSize });
        return response.plans;
      }),
      // Every membership, not only the active ones. An assignment outlives the
      // term it was made on: the profile is still held by someone whose cover
      // has ended, and filtering to `active` turned those holders into
      // "Inactive membership · Unknown plan" on the account page.
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<
          ListStreamingAccountMembershipOptionsQuery,
          ListStreamingAccountMembershipOptionsQueryVariables
        >(ListStreamingAccountMembershipOptionsDocument, { page, pageSize, status: null });
        return response.memberships;
      }),
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<
          ListStreamingAccountServiceOptionsQuery,
          ListStreamingAccountServiceOptionsQueryVariables
        >(ListStreamingAccountServiceOptionsDocument, { page, pageSize });
        return response.services;
      }),
    ]);

    return {
      items: data.streamingAccounts,
      membershipOptions: memberships.items.map((membership) => {
        const plan = plans.items.find((option) => option.id === membership.planId);

        return {
          ...membership,
          currencyCode: plan?.currencyCode,
          customerName: customers.items.find((customer) => customer.id === membership.customerId)
            ?.name,
          // Plans are priced per term, and a term is not always a month. What
          // an account earns is only comparable once every holder is on the
          // same clock.
          monthlyPrice:
            plan === undefined || plan.durationMonths <= 0
              ? undefined
              : Number.parseFloat(plan.price) / plan.durationMonths,
          planName: plan?.name,
        };
      }),
      serviceOptions: services.items.filter((service) => service.isActive),
      total: data.streamingAccounts.length,
    };
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load streaming accounts'
    );
    throw error;
  }
}
