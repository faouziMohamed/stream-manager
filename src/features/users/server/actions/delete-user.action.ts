'use server';

import { auth } from '@/lib/auth/auth';
import { canAccessConsole, isAdmin } from '@/lib/auth/role.helpers';
import { gqlRequest } from '@/lib/graphql/client';
import { createLogger } from '@/lib/logger';
import {
  DeleteUserDocument,
  type DeleteUserMutation,
  type DeleteUserMutationVariables,
} from '@/lib/graphql/generated/graphql';

const log = createLogger('users.actions');

export async function deleteUserAction(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    log.error('Access token missing from session');
    throw new Error('Unauthorized');
  }

  if (!canAccessConsole(session.user?.role) || !isAdmin(session.user?.role)) {
    log.error('Unauthorized access to deleteUser');
    throw new Error('Forbidden');
  }

  try {
    const data = await gqlRequest<DeleteUserMutation, DeleteUserMutationVariables>(
      DeleteUserDocument,
      {
        input: {
          id,
        },
      }
    );

    return data.deleteUser;
  } catch (error) {
    log.error({ error }, 'Failed to delete user');
    throw error;
  }
}
