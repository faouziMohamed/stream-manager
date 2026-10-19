import argon2 from 'argon2';

import { AppError } from '@/server/common/errors/app-error';
import { createAuthSession } from '@/server/features/auth/repositories/auth-sessions.repository';
import { findUserByEmail } from '@/server/features/auth/repositories/auth-users.repository';
import type { AuthPayload, UserModel } from '@/server/features/auth/schemas/model/auth.model';
import {
  createSessionId,
  createUserModel,
} from '@/server/features/auth/use-cases/auth-flow.helpers';

export async function loginWithPasswordUseCase(
  input: LoginWithPasswordInput,
  dependencies: LoginWithPasswordDependencies = defaultDependencies
): Promise<AuthPayload> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await dependencies.findUserByEmail(normalizedEmail);

  if (user === null || user.passwordHash === null) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await dependencies.verifyPassword(user.passwordHash, input.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
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

interface LoginWithPasswordInput {
  browser?: string | null;
  countryCode?: string | null;
  deviceType?: string | null;
  email: string;
  ipHash?: string | null;
  os?: string | null;
  password: string;
}

interface LoginWithPasswordDependencies {
  createAuthSession: (input: Parameters<typeof createAuthSession>[0]) => Promise<unknown>;
  createSessionId: typeof createSessionId;
  createUserModel: (user: LoginUserRecord) => UserModel;
  findUserByEmail: (email: string) => Promise<LoginUserRecord | null>;
  verifyPassword: (hash: string, password: string) => Promise<boolean>;
}

interface LoginUserRecord {
  avatar: string | null;
  email: string;
  id: string;
  name: string;
  passwordHash: string | null;
  role: 'admin' | 'accountant' | 'user';
}

const defaultDependencies: LoginWithPasswordDependencies = {
  createAuthSession,
  createSessionId,
  createUserModel,
  findUserByEmail,
  verifyPassword: argon2.verify,
};
