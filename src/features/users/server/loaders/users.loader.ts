import { auth } from '@/lib/auth/auth';
import { canAccessConsole, isAdmin } from '@/lib/auth/role.helpers';
import { gqlRequest } from '@/lib/graphql/client';
import { ListUsersDocument } from '@/lib/graphql/generated/graphql';
import type { ListUsersQuery } from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('users.loader');

export async function loadUsers() {
  const session = await auth();

  if (!session?.user?.id) {
    log.warn('Access token missing from session');
    return null;
  }

  if (!canAccessConsole(session.user?.role) || !isAdmin(session.user?.role)) {
    log.warn('Unauthorized access to users list');
    return null;
  }

  try {
    const data = await gqlRequest<ListUsersQuery>(ListUsersDocument, {});

    return data.users || [];
  } catch (error) {
    log.error({ error }, 'Failed to load users');
    return null;
  }
}
