'use server';

import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  CreateCustomerDocument,
  type CreateCustomerMutation,
  type CreateCustomerMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';
import type { CustomerFormValues } from '@/features/customers/shared/customer.schema';
import type { CustomerDto } from '@/features/customers/shared/customer.types';

const log = createLogger('create-customer.action');

export async function createCustomerAction(values: CustomerFormValues): Promise<CustomerDto> {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    throw new Error('Unauthorized');
  }

  try {
    const data = await gqlRequest<CreateCustomerMutation, CreateCustomerMutationVariables>(
      CreateCustomerDocument,
      {
        input: {
          language: values.language,
          name: values.name,
          email: values.email ?? null,
          phone: values.phone ?? null,
          notesContent: values.notes || null,
        },
      }
    );

    log.info({ customerId: data.createCustomer.id }, 'Customer created');
    return data.createCustomer as CustomerDto;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to create customer'
    );
    throw error;
  }
}
