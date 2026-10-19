'use server';

import { requireSession } from '@/lib/auth/require-session';
import { loadCustomerHub } from '@/features/customers/server/loaders/customer-hub.loader';
import type { CustomerHub } from '@/features/customers/shared/customer-hub.mapper';

/** Re-reads the hub after a mutation so React Query can refill the page. */
export async function getCustomerHubAction(customerId: string): Promise<CustomerHub> {
  await requireSession('You must be signed in to view customers');

  return loadCustomerHub(customerId);
}
