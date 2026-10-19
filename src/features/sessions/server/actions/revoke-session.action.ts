'use server';

import { auth } from '@/lib/auth/auth';
import { canAccessConsole } from '@/lib/auth/role.helpers';
import { gqlRequest } from '@/lib/graphql/client';
import {
  RevokeSessionDocument,
  type RevokeSessionMutation,
  type RevokeSessionMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('sessions.actions');

export async function revokeSessionAction(id: string): Promise<boolean> {
  const session = await auth();

  if (!session?.user?.id) {
    log.error('Access token missing from session');
    throw new Error('Unauthorized');
  }

  if (!canAccessConsole(session.user?.role)) {
    log.error('Unauthorized access to revokeSession');
    throw new Error('Forbidden');
  }

  const data = await gqlRequest<RevokeSessionMutation, RevokeSessionMutationVariables>(
    RevokeSessionDocument,
    { input: { id } }
  );

  log.info({ sessionId: id }, 'Session revoked');
  return data.revokeSession;
}
