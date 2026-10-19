import 'server-only';

import { auth } from '@/lib/auth/auth';
import { findActiveAuthSessionById } from '@/server/features/auth/repositories/auth-sessions.repository';
import { findUserById } from '@/server/features/auth/repositories/auth-users.repository';
import { createUserModel } from '@/server/features/auth/use-cases/auth-flow.helpers';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

const anonymousContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: null,
  user: null,
};

/**
 * Builds the GraphQL context from the Auth.js session cookie.
 *
 * There is no bearer token any more: Auth.js owns the browser session and
 * stores the `auth_sessions` row id in its JWT. Re-checking that row on every
 * request keeps sessions revocable server-side — revoking a session logs the
 * user out on their next request even though the cookie is still valid.
 */
export async function createGraphQLContext(): Promise<GqlContext> {
  const session = await auth();
  const sessionId = session?.sessionId;
  const userId = session?.user?.id;

  if (sessionId === undefined || userId === undefined) {
    return anonymousContext;
  }

  const authSession = await findActiveAuthSessionById(sessionId);

  if (authSession === null || authSession.userId !== userId) {
    return anonymousContext;
  }

  const user = await findUserById(userId);

  if (user === null) {
    return anonymousContext;
  }

  return {
    isAccountant: user.role === 'accountant',
    isAdmin: user.role === 'admin',
    sessionId: authSession.id,
    user: createUserModel(user),
  };
}
