'use server';

import { auth } from '@/lib/auth/auth';
import { canAccessConsole } from '@/lib/auth/role.helpers';
import { gqlRequest } from '@/lib/graphql/client';
import { SessionsDocument, type SessionsQuery } from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';
import type { SessionItem } from '@/features/sessions/shared/session.types';

const log = createLogger('sessions.actions');

export async function listSessionsAction(): Promise<SessionItem[]> {
  const session = await auth();

  if (!session?.user?.id) {
    log.error('Access token missing from session');
    throw new Error('Unauthorized');
  }

  if (!canAccessConsole(session.user?.role)) {
    log.error('Unauthorized access to sessions list');
    throw new Error('Forbidden');
  }

  const data = await gqlRequest<SessionsQuery>(SessionsDocument, {});

  return data.sessions;
}
