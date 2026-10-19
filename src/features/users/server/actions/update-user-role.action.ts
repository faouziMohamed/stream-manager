'use server';

import { auth } from '@/lib/auth/auth';
import { canAccessConsole, isAdmin } from '@/lib/auth/role.helpers';
import { gqlRequest } from '@/lib/graphql/client';
import { createLogger } from '@/lib/logger';
import {
  UpdateUserRoleDocument,
  type UpdateUserRoleMutation,
  type UpdateUserRoleMutationVariables,
} from '@/lib/graphql/generated/graphql.users';

const log = createLogger('users.actions');

export async function updateUserRoleAction(input: { id: string; role: string }) {
  const session = await auth();

  if (!session?.user?.id) {
    log.error('Access token missing from session');
    throw new Error('Unauthorized');
  }

  if (!canAccessConsole(session.user?.role) || !isAdmin(session.user?.role)) {
    log.error('Unauthorized access to updateUserRole');
    throw new Error('Forbidden');
  }

  try {
    const data = await gqlRequest<UpdateUserRoleMutation, UpdateUserRoleMutationVariables>(
      UpdateUserRoleDocument,
      {
        input: {
          id: input.id,
          role: input.role,
        },
      }
    );

    return data.updateUserRole;
  } catch (error) {
    log.error({ error }, 'Failed to update user role');
    throw error;
  }
}
