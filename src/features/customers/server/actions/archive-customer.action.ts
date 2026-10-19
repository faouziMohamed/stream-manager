'use server';

import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  ArchiveCustomerDocument,
  type ArchiveCustomerMutation,
  type ArchiveCustomerMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('archive-customer.action');

export async function archiveCustomerAction(
  id: string
): Promise<{ id: string; isActive: boolean }> {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    throw new Error('Unauthorized');
  }

  try {
    const data = await gqlRequest<ArchiveCustomerMutation, ArchiveCustomerMutationVariables>(
      ArchiveCustomerDocument,
      { id }
    );

    log.info({ customerId: id }, 'Customer archived');
    return { id: data.archiveCustomer.id, isActive: data.archiveCustomer.isActive };
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error), id },
      'Failed to archive customer'
    );
    throw error;
  }
}
