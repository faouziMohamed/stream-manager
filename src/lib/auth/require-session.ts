import 'server-only';

import { auth } from '@/lib/auth/auth';
import type { AppSession } from '@/lib/auth/auth.types';

/**
 * Asserts there is a signed-in session before a Server Action touches data.
 *
 * This is the cheap cookie-level check. Authorization proper still happens in
 * the use-cases (requireAdmin and friends) against the context built in
 * server/lib/graphql/context.ts, which also re-validates the auth_sessions row.
 */
export async function requireSession(message = 'You must be signed in'): Promise<AppSession> {
  const session = (await auth()) as AppSession | null;

  if (session === null || session.user?.id === undefined) {
    throw new Error(message);
  }

  return session;
}
