import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import { loadAllPages } from '@/lib/graphql/load-all-pages';
import {
  ListCustomersDocument,
  GetCustomerDocument,
  type ListCustomersQuery,
  type ListCustomersQueryVariables,
  type GetCustomerQuery,
  type GetCustomerQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';
import type {
  CustomerConnection,
  CustomerDetailDto,
} from '@/features/customers/shared/customer.types';

const log = createLogger('customers.loader');

const defaultCustomers: CustomerConnection = {
  items: [],
  pageInfo: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
};

export async function loadCustomers(): Promise<CustomerConnection> {
  try {
    const session = await auth();

    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading customers');
      return defaultCustomers;
    }

    return await loadAllPages(async (page, pageSize) => {
      const data = await gqlRequest<ListCustomersQuery, ListCustomersQueryVariables>(
        ListCustomersDocument,
        { page, pageSize }
      );

      return data.customers;
    });
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load customers'
    );
    throw error;
  }
}

export async function loadCustomer(id: string): Promise<CustomerDetailDto | null> {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    log.warn('No session when loading customer detail');
    return null;
  }

  const data = await gqlRequest<GetCustomerQuery, GetCustomerQueryVariables>(GetCustomerDocument, {
    id,
  });

  return data.customer ?? null;
}
