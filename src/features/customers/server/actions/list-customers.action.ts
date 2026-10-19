'use server';

import { loadCustomers } from '@/features/customers/server/loaders/customers.loader';
import type { CustomerConnection } from '@/features/customers/shared/customer.types';

export async function listCustomersAction(): Promise<CustomerConnection> {
  return loadCustomers();
}
