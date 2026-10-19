import { revokeAuthSessionById } from '@/server/features/auth/repositories/auth-sessions.repository';

export async function logoutUseCase(
  input: LogoutInput,
  dependencies: LogoutDependencies = defaultDependencies
): Promise<boolean> {
  await dependencies.revokeAuthSessionById(input.userId, input.sessionId);

  return true;
}

interface LogoutInput {
  sessionId: string;
  userId: string;
}

interface LogoutDependencies {
  revokeAuthSessionById: (userId: string, sessionId: string) => Promise<unknown>;
}

const defaultDependencies: LogoutDependencies = {
  revokeAuthSessionById,
};
