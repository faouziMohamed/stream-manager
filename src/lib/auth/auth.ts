import NextAuth from 'next-auth';
import type { NextAuthConfig, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';

import {
  SESSION_MAX_AGE_SECONDS,
  applyTokenToSession,
  applyUserToToken,
} from '@/lib/auth/auth.config';
import type { AppSession, AuthToken, AuthenticatedUser } from '@/lib/auth/auth.types';
import { ROUTES } from '@/lib/config/routes';
import { createLogger } from '@/lib/logger';
import { env } from '@/lib/settings/env';
import type { AuthPayload } from '@/server/features/auth/schemas/model/auth.model';
import {
  loginInputSchema,
  loginWithOAuthInputSchema,
} from '@/server/features/auth/schemas/validators/auth.validators';
import { findUserById } from '@/server/features/auth/repositories/auth-users.repository';
import { loginWithOAuthUseCase } from '@/server/features/auth/use-cases/login-with-oauth.use-case';
import { loginWithPasswordUseCase } from '@/server/features/auth/use-cases/login-with-password.use-case';
import { recordAuditEvent } from '@/server/features/audit/repositories/audit.repository';

const log = createLogger('auth');

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: ROUTES.auth.login,
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsedCredentials = loginInputSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          log.warn({ errors: parsedCredentials.error.flatten() }, 'Invalid credentials format');
          return null;
        }

        try {
          const payload = await loginWithPasswordUseCase({
            email: parsedCredentials.data.email.trim().toLowerCase(),
            password: parsedCredentials.data.password,
          });

          log.info({ userId: payload.user.id }, 'Password login successful');
          void recordAuditEvent({
            action: 'auth.signed_in',
            actor: {
              email: payload.user.email,
              id: payload.user.id,
              role: payload.user.role,
            },
            metadata: { provider: 'credentials', sessionId: payload.sessionId },
          });
          return toUser(payload);
        } catch (error) {
          log.error(
            {
              email: parsedCredentials.data.email,
              error: error instanceof Error ? error.message : String(error),
            },
            'Credentials provider authentication failed'
          );
          void recordAuditEvent({
            action: 'auth.sign_in_failed',
            actor: { email: parsedCredentials.data.email },
            metadata: {
              provider: 'credentials',
              reason: error instanceof Error ? error.message : 'Unknown error',
            },
          });
          return null;
        }
      },
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
  ],
  events: {
    async signOut(message) {
      const token = 'token' in message ? (message.token as AuthToken | null) : null;

      void recordAuditEvent({
        action: 'auth.signed_out',
        actor: {
          email: token?.user?.email,
          id: token?.userId,
          role: token?.role,
        },
        metadata: { sessionId: token?.sessionId },
      });
    },
  },
  callbacks: {
    async jwt({ token, account, profile, trigger, user }) {
      const appToken = applyUserToToken(token as AuthToken, user as AuthenticatedUser | undefined);

      // `useSession().update()` lands here. The role lives in the JWT and
      // would otherwise stay as it was at sign-in, so an operator promoted
      // while staring at the 403 would keep failing every guard. This is a
      // fresh read of the user row — not the token's own copy — and the token
      // is re-issued with what the database says now.
      if (trigger === 'update' && appToken.userId !== undefined) {
        const fresh = await findUserById(appToken.userId);

        if (fresh === null) {
          // The account is gone; leaving the old role in place would keep a
          // deleted user inside the console.
          appToken.sessionId = undefined;
          appToken.userId = undefined;

          return appToken;
        }

        const previousRole = appToken.role;

        applyUserToToken(appToken, {
          email: fresh.email,
          id: fresh.id,
          image: null,
          name: fresh.name,
          role: fresh.role,
          userId: fresh.id,
        } as AuthenticatedUser);

        log.info(
          { previousRole, role: fresh.role, userId: fresh.id },
          'Session re-read from the database'
        );

        return appToken;
      }

      // Credentials sign-in already recorded an auth_sessions row.
      if (appToken.sessionId !== undefined && profile === undefined) {
        return appToken;
      }

      if (profile === undefined) {
        return appToken;
      }

      const oauthProfile = getOAuthProfile(account?.provider, profile);

      if (oauthProfile === null) {
        return appToken;
      }

      const parsedProfile = loginWithOAuthInputSchema.safeParse(oauthProfile);

      if (!parsedProfile.success) {
        log.warn(
          { provider: account?.provider, errors: parsedProfile.error.flatten() },
          'OAuth profile failed validation'
        );
        return appToken;
      }

      try {
        const payload = await loginWithOAuthUseCase(parsedProfile.data);

        applyAuthPayload(appToken, payload);
        log.info({ userId: payload.user.id }, 'OAuth login successful');
        void recordAuditEvent({
          action: 'auth.signed_in',
          actor: {
            email: payload.user.email,
            id: payload.user.id,
            role: payload.user.role,
          },
          metadata: { provider: account?.provider, sessionId: payload.sessionId },
        });
      } catch (error) {
        log.error(
          {
            provider: account?.provider,
            email: oauthProfile.email,
            error: error instanceof Error ? error.message : String(error),
          },
          'OAuth login failed'
        );
        void recordAuditEvent({
          action: 'auth.sign_in_failed',
          actor: { email: oauthProfile.email },
          metadata: {
            provider: account?.provider,
            reason: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }

      return appToken;
    },
    session({ session, token }) {
      return applyTokenToSession(session as AppSession, token as AuthToken);
    },
  },
};

function applyAuthPayload(token: AuthToken, payload: AuthPayload): void {
  token.userId = payload.user.id;
  token.role = payload.user.role;
  token.sessionId = payload.sessionId;
  token.user = {
    id: payload.user.id,
    name: payload.user.name,
    email: payload.user.email,
    role: payload.user.role,
    image: payload.user.avatar,
  };
}

function toUser(payload: AuthPayload): User & AuthToken {
  return {
    id: payload.user.id,
    name: payload.user.name,
    email: payload.user.email,
    image: payload.user.avatar,
    role: payload.user.role,
    userId: payload.user.id,
    sessionId: payload.sessionId,
  };
}

type OAuthProfile = {
  email: string;
  name: string;
  avatar: string | null;
};

function getOAuthProfile(provider: string | undefined, profile: unknown): OAuthProfile | null {
  if (provider === 'github') {
    const githubProfile = profile as {
      id?: number | string;
      email?: string | null;
      name?: string | null;
      login?: string;
      avatar_url?: string | null;
    };

    if (
      githubProfile.email === undefined ||
      githubProfile.email === null ||
      githubProfile.id === undefined
    ) {
      return null;
    }

    return {
      email: githubProfile.email,
      name: githubProfile.name ?? githubProfile.login ?? githubProfile.email,
      avatar: githubProfile.avatar_url ?? null,
    };
  }

  return null;
}

const nextAuth = NextAuth(authConfig);

export const handlers = nextAuth.handlers;
export const auth = nextAuth.auth;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;
