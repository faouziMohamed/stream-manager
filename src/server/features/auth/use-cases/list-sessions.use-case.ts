import { listActiveAuthSessionsByUserId } from '@/server/features/auth/repositories/auth-sessions.repository';
import type { SessionModel } from '@/server/features/auth/schemas/model/auth.model';

export async function listSessionsUseCase(
  input: ListSessionsInput,
  dependencies: ListSessionsDependencies = defaultDependencies
): Promise<SessionModel[]> {
  const sessions = await dependencies.listActiveAuthSessionsByUserId(input.userId);

  return sessions.map((session) => ({
    browser: session.browser,
    countryCode: session.countryCode,
    createdAt: session.createdAt,
    deviceType: session.deviceType,
    id: session.id,
    ipHash: session.ipHash,
    lastUsedAt: session.lastUsedAt,
    os: session.os,
    userId: session.userId,
  }));
}

interface ListSessionsInput {
  userId: string;
}

interface ListSessionsDependencies {
  listActiveAuthSessionsByUserId: typeof listActiveAuthSessionsByUserId;
}

const defaultDependencies: ListSessionsDependencies = {
  listActiveAuthSessionsByUserId,
};
