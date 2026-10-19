import { canAccessConsole } from '@/lib/auth/role.helpers';

export type ConsoleSessionLike = {
  sessionId?: string;
  user?: {
    id?: string | null;
    role?: string | null;
  };
} | null;

export type SignedInSession = NonNullable<ConsoleSessionLike> & {
  sessionId: string;
};

/**
 * A session is usable when Auth.js issued it against a real auth_sessions row.
 * Whether that row is still active is re-checked server-side on every GraphQL
 * request; this is the cheap cookie-level check used for routing.
 */
export function hasSignedInSession(session: ConsoleSessionLike): session is SignedInSession {
  if (session === null || session === undefined) {
    return false;
  }

  const userId = session.user?.id;

  if (typeof userId !== 'string' || userId.length === 0) {
    return false;
  }

  return typeof session.sessionId === 'string' && session.sessionId.length > 0;
}

export function hasValidConsoleSession(session: ConsoleSessionLike): boolean {
  if (!hasSignedInSession(session)) {
    return false;
  }

  return canAccessConsole(session.user?.role ?? undefined);
}
