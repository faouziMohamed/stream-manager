'use server';

import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  MarkPaymentPaidDocument,
  type MarkPaymentPaidMutation,
  type MarkPaymentPaidMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('payments.mark-paid.action');

export async function markPaymentPaidAction(id: string): Promise<string> {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    throw new Error('You must be signed in to mark payments paid');
  }

  const data = await gqlRequest<MarkPaymentPaidMutation, MarkPaymentPaidMutationVariables>(
    MarkPaymentPaidDocument,
    { input: { id, paidDate: null } }
  );

  log.info({ id }, 'Payment marked paid');
  return data.markPaymentPaid.status;
}
