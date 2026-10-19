'use server';

import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  CreatePaymentDocument,
  type CreatePaymentMutation,
  type CreatePaymentMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('payments.create.action');

export type CreatePaymentActionInput = {
  membershipId: string;
  amount: string;
  currencyCode: string;
  dueDate: string;
  paidDate?: string;
  method?: string;
  notes?: string;
  status?: string;
};

export async function createPaymentAction(input: CreatePaymentActionInput) {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    throw new Error('You must be signed in to record payments');
  }

  const data = await gqlRequest<CreatePaymentMutation, CreatePaymentMutationVariables>(
    CreatePaymentDocument,
    {
      input: {
        membershipId: input.membershipId,
        amount: input.amount,
        currencyCode: input.currencyCode,
        dueDate: input.dueDate,
        paidDate: input.paidDate ?? null,
        method: input.method ?? null,
        notes: input.notes ?? null,
        status: input.status ?? 'paid',
      },
    }
  );

  log.info({ paymentId: data.createPayment.id }, 'Payment recorded');
  return data.createPayment;
}
