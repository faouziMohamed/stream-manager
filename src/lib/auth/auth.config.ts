import type { NextAuthConfig } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

import type { AppSession, AuthToken, AuthenticatedUser } from '@/lib/auth/auth.types';
import { ROUTES } from '@/lib/config/routes';
import { env } from '@/lib/settings/env';

// Edge-safe half of the Auth.js config: no database, no argon2, no pino.
// src/proxy.ts (middleware) instantiates NextAuth from this so the DB layer
// never gets bundled into the request-interception path. src/lib/auth/auth.ts
// extends it with the Credentials provider and the OAuth upsert, both of which
// only run in the Node.js runtime.

// Single long-lived session with no client-side refresh. The cookie stays
// revocable server-side because every GraphQL request re-checks the session id
// against a non-revoked row in auth_sessions (see server/lib/graphql/context.ts).
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function applyUserToToken(token: AuthToken, user: AuthenticatedUser | undefined): AuthToken {
  if (user === undefined) {
    return token;
  }

  const userId = user.userId ?? user.id ?? '';

  token.userId = userId;
  token.role = user.role;
  token.user = {
    id: userId,
    name: user.name ?? '',
    email: user.email ?? '',
    role: user.role ?? 'user',
    image: user.image ?? null,
  };

  if (user.sessionId !== undefined) {
    token.sessionId = user.sessionId;
  }

  return token;
}

export function applyTokenToSession(session: AppSession, token: AuthToken): AppSession {
  if (session.user !== undefined) {
    session.user.id = token.userId;
    session.user.role = token.role;
  }

  session.sessionId = token.sessionId;
  return session;
}

export const authBaseConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: ROUTES.auth.login,
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  providers: [
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      return applyUserToToken(token as AuthToken, user as AuthenticatedUser | undefined);
    },
    session({ session, token }) {
      return applyTokenToSession(session as AppSession, token as AuthToken);
    },
  },
};
