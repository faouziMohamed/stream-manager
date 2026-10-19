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
  ListMembershipsDocument,
  type ListMembershipsQuery,
  type ListMembershipsQueryVariables,
  ListPaymentsDocument,
  type ListPaymentsQuery,
  type ListPaymentsQueryVariables,
  ListServicesDocument,
  type ListServicesQuery,
  type ListServicesQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('memberships.loader');

type MembershipListItem = ListMembershipsQuery['memberships']['items'][number];
type CustomerOption = ListMembershipCustomerOptionsQuery['customers']['items'][number];
type PlanOption = ListMembershipPlanOptionsQuery['plans']['items'][number];

/**
 * `customers` and `plans` are the whole catalog, archived and retired records
 * included, because existing membership rows still point at them. The console
 * narrows them to the active ones where it renders a picker.
 */
type MembershipListPayload = {
  activeCount: number;
  activeServiceIds: string[];
  customers: CustomerOption[];
  items: MembershipListItem[];
  /**
   * Every payment, not only the pending ones. The ledger has to say whether a
   * term was paid, and "has no pending payment" is not the same statement —
   * it is also true of a term nobody ever billed. These were fetched already;
   * `pendingPayments` stays because the cancel dialog asks a narrower question.
   */
  payments: ListPaymentsQuery['payments']['items'];
  pendingPayments: ListPaymentsQuery['payments']['items'];
  plans: PlanOption[];
  recurringCount: number;
  total: number;
};

export async function loadMemberships(customerId?: string): Promise<MembershipListPayload> {
  const empty: MembershipListPayload = {
    activeCount: 0,
    activeServiceIds: [],
    customers: [],
    items: [],
    payments: [],
    pendingPayments: [],
    plans: [],
    recurringCount: 0,
    total: 0,
  };

  try {
    const session = await auth();

    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading memberships');
      return empty;
    }

    const [memberships, customers, payments, plans, services] = await Promise.all([
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<ListMembershipsQuery, ListMembershipsQueryVariables>(
          ListMembershipsDocument,
          { page, pageSize, customerId: customerId ?? null }
        );
        return response.memberships;
      }),
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<
          ListMembershipCustomerOptionsQuery,
          ListMembershipCustomerOptionsQueryVariables
        >(ListMembershipCustomerOptionsDocument, { page, pageSize });
        return response.customers;
      }),
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<ListPaymentsQuery, ListPaymentsQueryVariables>(
          ListPaymentsDocument,
          { dueFrom: null, dueTo: null, order: null, page, pageSize, status: null }
        );
        return response.payments;
      }),
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<
          ListMembershipPlanOptionsQuery,
          ListMembershipPlanOptionsQueryVariables
        >(ListMembershipPlanOptionsDocument, { isActive: null, page, pageSize });
        return response.plans;
      }),
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<ListServicesQuery, ListServicesQueryVariables>(
          ListServicesDocument,
          { page, pageSize }
        );
        return response.services;
      }),
    ]);

    return {
      activeCount: memberships.items.filter((item) => item.status === 'active').length,
      activeServiceIds: services.items.filter((s) => s.isActive).map((s) => s.id),
      customers: customers.items,
      items: memberships.items,
      payments: payments.items,
      pendingPayments: payments.items.filter(
        (payment) => payment.status === 'unpaid' || payment.status === 'overdue'
      ),
      plans: plans.items,
      recurringCount: memberships.items.filter((item) => item.isRecurring).length,
      total: memberships.pageInfo.total,
    };
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load memberships'
    );
    throw error;
  }
}
