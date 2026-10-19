'use server';

import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  UpdateCustomerDocument,
  type UpdateCustomerMutation,
  type UpdateCustomerMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';
import type { CustomerFormValues } from '@/features/customers/shared/customer.schema';
import type { CustomerDto } from '@/features/customers/shared/customer.types';

const log = createLogger('update-customer.action');

export async function updateCustomerAction(
  id: string,
  values: CustomerFormValues
): Promise<CustomerDto> {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    throw new Error('Unauthorized');
  }

  try {
    const data = await gqlRequest<UpdateCustomerMutation, UpdateCustomerMutationVariables>(
      UpdateCustomerDocument,
      {
        input: {
          id,
          language: values.language,
          name: values.name,
          email: values.email ?? null,
          phone: values.phone ?? null,
          isActive: null,
          notesContent: values.notes || null,
        },
      }
    );

    log.info({ customerId: id }, 'Customer updated');
    return data.updateCustomer as CustomerDto;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error), id },
      'Failed to update customer'
    );
    throw error;
  }
}
