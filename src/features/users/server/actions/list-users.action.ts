'use server';

import type { UserManagementDto } from '@/lib/graphql/generated/graphql';

import { loadUsers } from '@/features/users/server/loaders/users.loader';
import { createLogger } from '@/lib/logger';

const log = createLogger('users.actions');

export async function listUsersAction(): Promise<UserManagementDto[]> {
  const users = await loadUsers();

  if (users === null) {
    log.warn('Unable to list users from server action');
    throw new Error('Unable to load users');
  }

  return users;
}
