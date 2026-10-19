'use server';

import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  ArchiveServiceDocument,
  RestoreServiceDocument,
  type ArchiveServiceMutation,
  type ArchiveServiceMutationVariables,
  type RestoreServiceMutation,
  type RestoreServiceMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('services.toggle-state.action');

export async function archiveServiceAction(id: string): Promise<boolean> {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    throw new Error('You must be signed in to archive services');
  }

  const data = await gqlRequest<ArchiveServiceMutation, ArchiveServiceMutationVariables>(
    ArchiveServiceDocument,
    { id }
  );

  log.info({ id }, 'Service archived');
  return data.archiveService.isActive;
}

export async function restoreServiceAction(id: string): Promise<boolean> {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    throw new Error('You must be signed in to restore services');
  }

  const data = await gqlRequest<RestoreServiceMutation, RestoreServiceMutationVariables>(
    RestoreServiceDocument,
    { id }
  );

  log.info({ id }, 'Service restored');
  return data.restoreService.isActive;
}
