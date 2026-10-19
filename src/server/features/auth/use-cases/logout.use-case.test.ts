import { logoutUseCase } from '@/server/features/auth/use-cases/logout.use-case';

describe('logoutUseCase', () => {
  it('revokes the current session', async () => {
    let revokeSessionCalled = false;

    const result = await logoutUseCase(
      { sessionId: 'ses_test', userId: 'usr_test' },
      {
        revokeAuthSessionById: async (userId, sessionId) => {
          revokeSessionCalled = true;
          expect(userId).toBe('usr_test');
          expect(sessionId).toBe('ses_test');
          return null;
        },
      }
    );

    expect(result).toBe(true);
    expect(revokeSessionCalled).toBe(true);
  });
});
