'use server';

import { loadMemberships } from '@/features/memberships/server/loaders/memberships.loader';

export async function listMembershipsAction(customerId?: string) {
  return loadMemberships(customerId);
}
