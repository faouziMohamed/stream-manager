import { AppError } from '@/server/common/errors/app-error';
import { revokeAuthSessionById } from '@/server/features/auth/repositories/auth-sessions.repository';

// Revoke a single session the caller owns. Because every authenticated request
// re-checks its `sid` against a non-revoked session row, revoking here
// invalidates that session's access token on its next request.
export async function revokeSessionUseCase(
  input: RevokeSessionInput,
  dependencies: RevokeSessionDependencies = defaultDependencies
): Promise<boolean> {
  const revoked = await dependencies.revokeAuthSessionById(input.userId, input.sessionId);

  if (revoked === null) {
    throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
  }

  return true;
}

interface RevokeSessionInput {
  sessionId: string;
  userId: string;
}

interface RevokeSessionDependencies {
  revokeAuthSessionById: typeof revokeAuthSessionById;
}

const defaultDependencies: RevokeSessionDependencies = {
  revokeAuthSessionById,
};
