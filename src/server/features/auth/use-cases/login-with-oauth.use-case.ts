import { createResourceId } from '@/server/common/utils/resource-id';
import { AppError } from '@/server/common/errors/app-error';
import { env } from '@/server/config/env';
import { createAuthSession } from '@/server/features/auth/repositories/auth-sessions.repository';
import {
  createAuthUser,
  findUserByEmail,
  updateAuthUserProfile,
  updateAuthUserRole,
} from '@/server/features/auth/repositories/auth-users.repository';
import type {
  AuthPayload,
  UserModel,
  UserRole,
} from '@/server/features/auth/schemas/model/auth.model';
import {
  createSessionId,
  createUserModel,
} from '@/server/features/auth/use-cases/auth-flow.helpers';

export async function loginWithOAuthUseCase(
  input: LoginWithOAuthInput,
  dependencies: LoginWithOAuthDependencies = defaultDependencies
): Promise<AuthPayload> {
  const resolvedRole = dependencies.resolveOAuthRole(input.email);
  const existingUser = await dependencies.findUserByEmail(input.email);
  const user =
    existingUser === null
      ? await dependencies.createAuthUser({
          avatar: input.avatar ?? null,
          email: input.email,
          id: dependencies.createResourceId('usr'),
          name: input.name,
          role: resolvedRole,
        })
      : await updateExistingOAuthUser(existingUser, input, resolvedRole, dependencies);

  if (user === null) {
    throw new AppError(
      'OAuth user could not be created or updated',
      500,
      'AUTH_OAUTH_USER_UPSERT_FAILED'
    );
  }

  const sessionId = dependencies.createSessionId();

  await dependencies.createAuthSession({
    browser: input.browser,
    countryCode: input.countryCode,
    deviceType: input.deviceType,
    id: sessionId,
    ipHash: input.ipHash,
    os: input.os,
    userId: user.id,
  });

  return {
    sessionId,
    user: dependencies.createUserModel(user),
  };
}

interface LoginWithOAuthInput {
  avatar?: string | null;
  browser?: string | null;
  countryCode?: string | null;
  deviceType?: string | null;
  email: string;
  ipHash?: string | null;
  name: string;
  os?: string | null;
}

interface LoginWithOAuthDependencies {
  createAuthSession: (input: Parameters<typeof createAuthSession>[0]) => Promise<unknown>;
  createAuthUser: (input: Parameters<typeof createAuthUser>[0]) => Promise<OAuthUserRecord | null>;
  createResourceId: typeof createResourceId;
  createSessionId: typeof createSessionId;
  createUserModel: (user: OAuthUserRecord) => UserModel;
  findUserByEmail: (email: string) => Promise<OAuthUserRecord | null>;
  resolveOAuthRole: (email: string) => UserRole | undefined;
  updateAuthUserProfile: (
    id: string,
    input: Parameters<typeof updateAuthUserProfile>[1]
  ) => Promise<OAuthUserRecord | null>;
  updateAuthUserRole: (id: string, role: UserRole) => Promise<OAuthUserRecord | null>;
}

interface OAuthUserRecord {
  avatar: string | null;
  email: string;
  id: string;
  name: string;
  role: 'admin' | 'accountant' | 'user';
}

const defaultDependencies: LoginWithOAuthDependencies = {
  createAuthSession,
  createAuthUser,
  createResourceId,
  createSessionId,
  createUserModel,
  findUserByEmail,
  resolveOAuthRole,
  updateAuthUserProfile,
  updateAuthUserRole,
};

async function updateExistingOAuthUser(
  existingUser: OAuthUserRecord,
  input: LoginWithOAuthInput,
  resolvedRole: UserRole | undefined,
  dependencies: LoginWithOAuthDependencies
): Promise<OAuthUserRecord | null> {
  const updatedUser = await dependencies.updateAuthUserProfile(existingUser.id, {
    avatar: input.avatar ?? existingUser.avatar,
    name: input.name,
  });

  if (updatedUser === null) {
    return null;
  }

  if (resolvedRole === undefined || updatedUser.role === resolvedRole) {
    return updatedUser;
  }

  return dependencies.updateAuthUserRole(updatedUser.id, resolvedRole);
}

function resolveOAuthRole(email: string): UserRole | undefined {
  if (env.SEED_AUTH_EMAIL === undefined || env.SEED_AUTH_ROLE === undefined) {
    return undefined;
  }

  if (email.toLowerCase() !== env.SEED_AUTH_EMAIL.toLowerCase()) {
    return undefined;
  }

  return env.SEED_AUTH_ROLE;
}
