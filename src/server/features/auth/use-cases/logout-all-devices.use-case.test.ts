import { logoutAllDevicesUseCase } from '@/server/features/auth/use-cases/logout-all-devices.use-case';

describe('logoutAllDevicesUseCase', () => {
  it('revokes all sessions for the user', async () => {
    let revokeCalled = false;

    const result = await logoutAllDevicesUseCase(
      { userId: 'usr_test' },
      {
        revokeAllAuthSessionsByUserId: async (userId) => {
          revokeCalled = true;
          expect(userId).toBe('usr_test');
        },
      }
    );

    expect(result).toBe(true);
    expect(revokeCalled).toBe(true);
  });
});
