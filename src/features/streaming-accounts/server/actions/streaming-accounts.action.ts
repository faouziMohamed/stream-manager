'use server';

import type { StreamingProfileValues } from '@/features/streaming-accounts/shared/streaming-profile.schema';
import { loadStreamingAccounts } from '@/features/streaming-accounts/server/loaders/streaming-accounts.loader';
import { requireSession } from '@/lib/auth/require-session';
import { gqlRequest } from '@/lib/graphql/client';
import {
  AssignProfileToMembershipDocument,
  type AssignProfileToMembershipMutation,
  type AssignProfileToMembershipMutationVariables,
  CreateStreamingAccountDocument,
  type CreateStreamingAccountMutation,
  type CreateStreamingAccountMutationVariables,
  CreateStreamingProfileDocument,
  type CreateStreamingProfileMutation,
  type CreateStreamingProfileMutationVariables,
  DeleteStreamingAccountDocument,
  type DeleteStreamingAccountMutation,
  type DeleteStreamingAccountMutationVariables,
  DeleteStreamingProfileDocument,
  type DeleteStreamingProfileMutation,
  type DeleteStreamingProfileMutationVariables,
  UnassignProfileDocument,
  type UnassignProfileMutation,
  type UnassignProfileMutationVariables,
  UpdateStreamingAccountDocument,
  type UpdateStreamingAccountMutation,
  type UpdateStreamingAccountMutationVariables,
  UpdateStreamingProfileDocument,
  type UpdateStreamingProfileMutation,
  type UpdateStreamingProfileMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('streaming-accounts.action');

export async function listStreamingAccountsAction() {
  return loadStreamingAccounts();
}

export async function createStreamingAccountAction(
  input: CreateStreamingAccountMutationVariables['input']
) {
  await requireSession('You must be signed in to manage streaming accounts');
  const data = await gqlRequest<
    CreateStreamingAccountMutation,
    CreateStreamingAccountMutationVariables
  >(CreateStreamingAccountDocument, { input });

  log.info({ accountId: data.createStreamingAccount.id }, 'Streaming account created');
  return data.createStreamingAccount;
}

export async function createStreamingProfileAction(
  accountId: string,
  values: StreamingProfileValues
) {
  await requireSession('You must be signed in to manage streaming accounts');
  const data = await gqlRequest<
    CreateStreamingProfileMutation,
    CreateStreamingProfileMutationVariables
  >(CreateStreamingProfileDocument, {
    input: { accountId, name: values.name, pin: values.pin || null },
  });

  log.info({ accountId, profileId: data.createStreamingProfile.id }, 'Streaming profile created');
  return data.createStreamingProfile;
}

export async function assignProfileToMembershipAction(
  input: AssignProfileToMembershipMutationVariables['input']
) {
  await requireSession('You must be signed in to manage streaming accounts');
  const data = await gqlRequest<
    AssignProfileToMembershipMutation,
    AssignProfileToMembershipMutationVariables
  >(AssignProfileToMembershipDocument, { input });

  log.info({ assignmentId: data.assignProfileToMembership.id }, 'Streaming profile assigned');
  return data.assignProfileToMembership;
}

export async function unassignProfileAction(assignmentId: string) {
  await requireSession('You must be signed in to manage streaming accounts');
  const data = await gqlRequest<UnassignProfileMutation, UnassignProfileMutationVariables>(
    UnassignProfileDocument,
    { input: { assignmentId } }
  );

  log.info({ assignmentId, profileId: data.unassignProfile.id }, 'Streaming profile unassigned');
  return data.unassignProfile;
}

export async function updateStreamingAccountAction(
  input: UpdateStreamingAccountMutationVariables['input']
) {
  await requireSession('You must be signed in to manage streaming accounts');
  const data = await gqlRequest<
    UpdateStreamingAccountMutation,
    UpdateStreamingAccountMutationVariables
  >(UpdateStreamingAccountDocument, { input });

  log.info({ accountId: data.updateStreamingAccount.id }, 'Streaming account updated');
  return data.updateStreamingAccount;
}

export async function deleteStreamingAccountAction(id: string) {
  await requireSession('You must be signed in to manage streaming accounts');
  const data = await gqlRequest<
    DeleteStreamingAccountMutation,
    DeleteStreamingAccountMutationVariables
  >(DeleteStreamingAccountDocument, { input: { id } });

  log.info({ accountId: data.deleteStreamingAccount.id }, 'Streaming account deleted');
  return data.deleteStreamingAccount;
}

export async function updateStreamingProfileAction(
  input: UpdateStreamingProfileMutationVariables['input']
) {
  await requireSession('You must be signed in to manage streaming accounts');
  const data = await gqlRequest<
    UpdateStreamingProfileMutation,
    UpdateStreamingProfileMutationVariables
  >(UpdateStreamingProfileDocument, { input });

  log.info({ profileId: data.updateStreamingProfile.id }, 'Streaming profile updated');
  return data.updateStreamingProfile;
}

export async function deleteStreamingProfileAction(id: string) {
  await requireSession('You must be signed in to manage streaming accounts');
  const data = await gqlRequest<
    DeleteStreamingProfileMutation,
    DeleteStreamingProfileMutationVariables
  >(DeleteStreamingProfileDocument, { input: { id } });

  log.info({ profileId: data.deleteStreamingProfile.id }, 'Streaming profile deleted');
  return data.deleteStreamingProfile;
}
