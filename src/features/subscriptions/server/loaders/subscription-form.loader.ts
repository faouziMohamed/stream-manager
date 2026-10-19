import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import { loadAllPages } from '@/lib/graphql/load-all-pages';
import {
  ListSubscriptionCustomerOptionsDocument,
  type ListSubscriptionCustomerOptionsQuery,
  type ListSubscriptionCustomerOptionsQueryVariables,
  ListSubscriptionPlanOptionsDocument,
  type ListSubscriptionPlanOptionsQuery,
  type ListSubscriptionPlanOptionsQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('subscription-form.loader');

export type SubscriptionCustomerOption =
  ListSubscriptionCustomerOptionsQuery['customers']['items'][number];
export type SubscriptionPlanOption = ListSubscriptionPlanOptionsQuery['plans']['items'][number];

export type SubscriptionFormOptions = {
  customers: SubscriptionCustomerOption[];
  plans: SubscriptionPlanOption[];
};

/**
 * Everything the single-screen form needs, in one round trip.
 *
 * Plans and customers load independently: a missing plan list is fatal to the
 * form, but a missing customer list still lets the operator create a new one,
 * so neither failure is allowed to blank the whole page.
 */
export async function loadSubscriptionFormOptions(): Promise<SubscriptionFormOptions> {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    log.warn('No session when loading subscription form options');
    return { customers: [], plans: [] };
  }

  const [customers, plans] = await Promise.all([loadCustomers(), loadPlans()]);

  return { customers, plans };
}

async function loadCustomers(): Promise<SubscriptionCustomerOption[]> {
  try {
    const connection = await loadAllPages(async (page, pageSize) => {
      const data = await gqlRequest<
        ListSubscriptionCustomerOptionsQuery,
        ListSubscriptionCustomerOptionsQueryVariables
      >(ListSubscriptionCustomerOptionsDocument, { page, pageSize });

      return data.customers;
    });

    return connection.items.filter((customer) => customer.isActive);
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load customer options'
    );
    return [];
  }
}

async function loadPlans(): Promise<SubscriptionPlanOption[]> {
  try {
    const connection = await loadAllPages(async (page, pageSize) => {
      const data = await gqlRequest<
        ListSubscriptionPlanOptionsQuery,
        ListSubscriptionPlanOptionsQueryVariables
      >(ListSubscriptionPlanOptionsDocument, { isActive: true, page, pageSize });

      return data.plans;
    });

    return connection.items;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load plan options'
    );
    return [];
  }
}
