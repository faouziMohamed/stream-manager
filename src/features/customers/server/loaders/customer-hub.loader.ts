import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import { loadAllPages } from '@/lib/graphql/load-all-pages';
import {
  CustomerHubMembershipsDocument,
  type CustomerHubMembershipsQuery,
  type CustomerHubMembershipsQueryVariables,
  CustomerHubPaymentsDocument,
  type CustomerHubPaymentsQuery,
  type CustomerHubPaymentsQueryVariables,
  CustomerHubPlansDocument,
  type CustomerHubPlansQuery,
  type CustomerHubPlansQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';
import { buildHub, emptyCustomerHub } from '@/features/customers/shared/customer-hub.mapper';
import type { CustomerHub } from '@/features/customers/shared/customer-hub.mapper';

const log = createLogger('customer-hub.loader');

/**
 * Everything about one customer in a single view: their subscriptions with the
 * payments that belong to each, so routine work stops meaning four pages.
 */
export async function loadCustomerHub(customerId: string): Promise<CustomerHub> {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    log.warn('No session when loading customer hub');
    return emptyCustomerHub;
  }

  try {
    const [memberships, payments, plans] = await Promise.all([
      loadAllPages(async (page, pageSize) => {
        const data = await gqlRequest<
          CustomerHubMembershipsQuery,
          CustomerHubMembershipsQueryVariables
        >(CustomerHubMembershipsDocument, { customerId, page, pageSize });

        return data.memberships;
      }),
      loadAllPages(async (page, pageSize) => {
        const data = await gqlRequest<CustomerHubPaymentsQuery, CustomerHubPaymentsQueryVariables>(
          CustomerHubPaymentsDocument,
          { customerId, page, pageSize }
        );

        return data.payments;
      }),
      loadAllPages(async (page, pageSize) => {
        const data = await gqlRequest<CustomerHubPlansQuery, CustomerHubPlansQueryVariables>(
          CustomerHubPlansDocument,
          { page, pageSize }
        );

        return data.plans;
      }),
    ]);

    return buildHub(memberships.items, payments.items, plans.items);
  } catch (error) {
    log.error(
      { customerId, error: error instanceof Error ? error.message : String(error) },
      'Failed to load customer hub'
    );
    throw error;
  }
}
