'use server';

import { auth } from '@/lib/auth/auth';
import { canAccessConsole, isAdmin } from '@/lib/auth/role.helpers';
import { gqlRequest } from '@/lib/graphql/client';
import { createLogger } from '@/lib/logger';
import {
  LogoutUserDevicesDocument,
  type LogoutUserDevicesMutation,
  type LogoutUserDevicesMutationVariables,
} from '@/lib/graphql/generated/graphql.users';

const log = createLogger('users.actions');

export async function logoutUserDevicesAction(userId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    log.error('Access token missing from session');
    throw new Error('Unauthorized');
  }

  if (!canAccessConsole(session.user?.role) || !isAdmin(session.user?.role)) {
    log.error('Unauthorized access to logoutUserDevices');
    throw new Error('Forbidden');
  }

  const data = await gqlRequest<LogoutUserDevicesMutation, LogoutUserDevicesMutationVariables>(
    LogoutUserDevicesDocument,
    { input: { userId } }
  );

  log.info({ userId }, 'All sessions revoked for user');
  return data.logoutUserDevices;
}
