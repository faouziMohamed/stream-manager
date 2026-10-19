'use server';

import { requireSession } from '@/lib/auth/require-session';
import { gqlRequest } from '@/lib/graphql/client';
import {
  CancelMembershipDocument,
  type CancelMembershipMutation,
  type CancelMembershipMutationVariables,
  CreateMembershipDocument,
  type CreateMembershipMutation,
  type CreateMembershipMutationVariables,
  RenewMembershipDocument,
  type RenewMembershipMutation,
  type RenewMembershipMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('memberships.mutate.action');

export async function createMembershipAction(input: CreateMembershipMutationVariables['input']) {
  await requireSession('You must be signed in to manage memberships');
  try {
    const data = await gqlRequest<CreateMembershipMutation, CreateMembershipMutationVariables>(
      CreateMembershipDocument,
      { input }
    );
    log.info({ id: data.createMembership.id }, 'Membership created');
    return data.createMembership;
  } catch (error) {
    throw new Error(pickApiMessage(error, 'Failed to create membership'));
  }
}

export async function cancelMembershipAction(id: string) {
  await requireSession('You must be signed in to manage memberships');
  try {
    const data = await gqlRequest<CancelMembershipMutation, CancelMembershipMutationVariables>(
      CancelMembershipDocument,
      { input: { confirmed: true, id } }
    );
    log.info({ id }, 'Membership cancelled');
    return data.cancelMembership;
  } catch (error) {
    throw new Error(pickApiMessage(error, 'Failed to cancel membership'));
  }
}

export async function renewMembershipAction(input: RenewMembershipActionInput) {
  await requireSession('You must be signed in to manage memberships');
  try {
    const data = await gqlRequest<RenewMembershipMutation, RenewMembershipMutationVariables>(
      RenewMembershipDocument,
      { input: { ...input, paidDate: input.paidDate ?? null } }
    );
    log.info(input, 'Membership renewed');
    return data.renewMembership;
  } catch (error) {
    throw new Error(pickApiMessage(error, 'Failed to renew membership'));
  }
}

export type RenewMembershipActionInput = {
  id: string;
  /** Settle the payments this renewal creates. */
  markPaid: boolean;
  /** The day the money was taken, when it was recorded later. */
  paidDate?: string;
  /** Consecutive plan terms to add, 1–12. */
  terms: number;
};

function pickApiMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const gqlError = error as unknown as { response?: { errors?: { message?: string }[] } };
    const firstMessage = gqlError.response?.errors?.[0]?.message;
    if (typeof firstMessage === 'string' && firstMessage.length > 0) return firstMessage;
    if (error.message.length > 0) return error.message;
  }
  return fallback;
}
