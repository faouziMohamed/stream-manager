import { loginWithPasswordUseCase } from '@/server/features/auth/use-cases/login-with-password.use-case';

describe('loginWithPasswordUseCase', () => {
  it('returns an AuthPayload on successful login', async () => {
    const result = await loginWithPasswordUseCase(
      { email: 'admin@example.com', password: 'correct-password' },
      {
        createAuthSession: async () => undefined as never,
        createSessionId: () => 'ses_test',
        createUserModel: (user) => ({
          avatar: user.avatar,
          email: user.email,
          id: user.id,
          name: user.name,
          role: user.role,
        }),
        findUserByEmail: async () => ({
          avatar: null,
          createdAt: new Date('2026-01-01'),
          email: 'admin@example.com',
          id: 'usr_test',
          name: 'Admin',
          passwordHash: 'hashed_password',
          role: 'admin' as const,
          updatedAt: new Date('2026-01-01'),
        }),
        verifyPassword: async () => true,
      }
    );

    expect(result.sessionId).toBe('ses_test');
    expect(result.user.email).toBe('admin@example.com');
    expect(result.user.role).toBe('admin');
  });

  it('throws INVALID_CREDENTIALS when user is not found', async () => {
    await expect(
      loginWithPasswordUseCase(
        { email: 'unknown@example.com', password: 'password123' },
        {
          createAuthSession: async () => undefined as never,
          createSessionId: () => 'ses_test',
          createUserModel: () => ({}) as never,
          findUserByEmail: async () => null as never,
          verifyPassword: async () => true,
        }
      )
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });

  it('normalizes credentials email before user lookup', async () => {
    let lookedUpEmail = '';

    await loginWithPasswordUseCase(
      { email: '  Admin@Example.com  ', password: 'correct-password' },
      {
        createAuthSession: async () => undefined as never,
        createSessionId: () => 'ses_test',
        createUserModel: (user) => ({
          avatar: user.avatar,
          email: user.email,
          id: user.id,
          name: user.name,
          role: user.role,
        }),
        findUserByEmail: async (email) => {
          lookedUpEmail = email;
          return {
            avatar: null,
            createdAt: new Date('2026-01-01'),
            email,
            id: 'usr_test',
            name: 'Admin',
            passwordHash: 'hashed_password',
            role: 'admin' as const,
            updatedAt: new Date('2026-01-01'),
          };
        },
        verifyPassword: async () => true,
      }
    );

    expect(lookedUpEmail).toBe('admin@example.com');
  });

  it('throws INVALID_CREDENTIALS when user has no password hash', async () => {
    await expect(
      loginWithPasswordUseCase(
        { email: 'oauth@example.com', password: 'password123' },
        {
          createAuthSession: async () => undefined as never,
          createSessionId: () => 'ses_test',
          createUserModel: () => ({}) as never,
          findUserByEmail: async () => ({
            avatar: null,
            createdAt: new Date('2026-01-01'),
            email: 'oauth@example.com',
            id: 'usr_test',
            name: 'OAuth User',
            passwordHash: null,
            role: 'user' as const,
            updatedAt: new Date('2026-01-01'),
          }),
          verifyPassword: async () => true,
        }
      )
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });

  it('throws INVALID_CREDENTIALS when password does not match', async () => {
    await expect(
      loginWithPasswordUseCase(
        { email: 'admin@example.com', password: 'wrong-password' },
        {
          createAuthSession: async () => undefined as never,
          createSessionId: () => 'ses_test',
          createUserModel: () => ({}) as never,
          findUserByEmail: async () => ({
            avatar: null,
            createdAt: new Date('2026-01-01'),
            email: 'admin@example.com',
            id: 'usr_test',
            name: 'Admin',
            passwordHash: 'hashed_password',
            role: 'admin' as const,
            updatedAt: new Date('2026-01-01'),
          }),
          verifyPassword: async () => false,
        }
      )
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      statusCode: 401,
    });
  });
});
