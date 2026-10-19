import { authUserRow } from '@/server/features/auth/use-cases/login-with-oauth.fixtures.test-support';
import { loginWithOAuthUseCase } from '@/server/features/auth/use-cases/login-with-oauth.use-case';
import type { UserRole } from '@/server/features/auth/schemas/model/auth.model';

// No env-mapped role for any address; implicit undefined keeps lint happy.
function resolveNoOAuthRole(): UserRole | undefined {
  return;
}

describe('loginWithOAuthUseCase', () => {
  it('creates a new user and returns AuthPayload when user does not exist', async () => {
    const result = await loginWithOAuthUseCase(
      { email: 'new@example.com', name: 'New User' },
      {
        createAuthSession: async () => undefined as never,
        createAuthUser: async (input) =>
          authUserRow({
            avatar: input.avatar ?? null,
            email: input.email,
            id: input.id,
            name: input.name,
          }),
        createResourceId: () => 'usr_test',
        createSessionId: () => 'ses_test',
        createUserModel: (user) => ({
          avatar: user.avatar,
          email: user.email,
          id: user.id,
          name: user.name,
          role: user.role,
        }),
        findUserByEmail: async () => null as never,
        resolveOAuthRole: resolveNoOAuthRole,
        updateAuthUserProfile: async () => null as never,
        updateAuthUserRole: async () => null as never,
      }
    );

    expect(result.sessionId).toBe('ses_test');
    expect(result.user.email).toBe('new@example.com');
    expect(result.user.name).toBe('New User');
  });

  it('updates existing user and returns AuthPayload when user already exists', async () => {
    const result = await loginWithOAuthUseCase(
      {
        email: 'existing@example.com',
        name: 'Updated Name',
        avatar: 'https://example.com/avatar.png',
      },
      {
        createAuthSession: async () => undefined as never,
        createAuthUser: async () => null as never,
        createResourceId: () => 'usr_test',
        createSessionId: () => 'ses_test',
        createUserModel: (user) => ({
          avatar: user.avatar,
          email: user.email,
          id: user.id,
          name: user.name,
          role: user.role,
        }),
        findUserByEmail: async () =>
          authUserRow({
            avatar: null,
            email: 'existing@example.com',
            id: 'usr_existing',
            name: 'Existing User',
            role: 'user' as const,
          }),
        resolveOAuthRole: resolveNoOAuthRole,
        updateAuthUserProfile: async (id, input) =>
          authUserRow({
            avatar: input.avatar ?? null,
            email: 'existing@example.com',
            id,
            name: input.name,
            role: 'user' as const,
          }),
        updateAuthUserRole: async () => null as never,
      }
    );

    expect(result.sessionId).toBe('ses_test');
    expect(result.user.email).toBe('existing@example.com');
    expect(result.user.name).toBe('Updated Name');
  });

  it('throws when createAuthUser returns null', async () => {
    await expect(
      loginWithOAuthUseCase(
        { email: 'new@example.com', name: 'New User' },
        {
          createAuthSession: async () => undefined as never,
          createAuthUser: async () => null as never,
          createResourceId: () => 'usr_test',
          createSessionId: () => 'ses_test',
          createUserModel: () => ({}) as never,
          findUserByEmail: async () => null as never,
          resolveOAuthRole: resolveNoOAuthRole,
          updateAuthUserProfile: async () => null as never,
          updateAuthUserRole: async () => null as never,
        }
      )
    ).rejects.toThrow('OAuth user could not be created or updated');
  });

  it('throws when updateAuthUserProfile returns null', async () => {
    await expect(
      loginWithOAuthUseCase(
        { email: 'existing@example.com', name: 'Updated' },
        {
          createAuthSession: async () => undefined as never,
          createAuthUser: async () => null as never,
          createResourceId: () => 'usr_test',
          createSessionId: () => 'ses_test',
          createUserModel: () => ({}) as never,
          findUserByEmail: async () =>
            authUserRow({
              avatar: null,
              email: 'existing@example.com',
              id: 'usr_existing',
              name: 'Existing',
              role: 'user' as const,
            }),
          resolveOAuthRole: resolveNoOAuthRole,
          updateAuthUserProfile: async () => null as never,
          updateAuthUserRole: async () => null as never,
        }
      )
    ).rejects.toThrow('OAuth user could not be created or updated');
  });

  it('throws AppError metadata when OAuth user upsert fails', async () => {
    await expect(
      loginWithOAuthUseCase(
        { email: 'new@example.com', name: 'New User' },
        {
          createAuthSession: async () => undefined as never,
          createAuthUser: async () => null as never,
          createResourceId: () => 'usr_test',
          createSessionId: () => 'ses_test',
          createUserModel: () => ({}) as never,
          findUserByEmail: async () => null as never,
          resolveOAuthRole: resolveNoOAuthRole,
          updateAuthUserProfile: async () => null as never,
          updateAuthUserRole: async () => null as never,
        }
      )
    ).rejects.toMatchObject({
      code: 'AUTH_OAUTH_USER_UPSERT_FAILED',
      statusCode: 500,
    });
  });

  it('assigns configured role when creating a seeded OAuth user', async () => {
    const createdRoles: Array<string | undefined> = [];

    const result = await loginWithOAuthUseCase(
      { email: 'seed@example.com', name: 'Seed User' },
      {
        createAuthSession: async () => undefined as never,
        createAuthUser: async (input) => {
          createdRoles.push(input.role);
          return authUserRow({
            avatar: input.avatar ?? null,
            email: input.email,
            id: input.id,
            name: input.name,
            role: input.role,
          });
        },
        createResourceId: () => 'usr_seed',
        createSessionId: () => 'ses_seed',
        createUserModel: (user) => ({
          avatar: user.avatar,
          email: user.email,
          id: user.id,
          name: user.name,
          role: user.role,
        }),
        findUserByEmail: async () => null as never,
        resolveOAuthRole: () => 'admin',
        updateAuthUserProfile: async () => null as never,
        updateAuthUserRole: async () => null as never,
      }
    );

    expect(createdRoles).toStrictEqual(['admin']);
    expect(result.user.role).toBe('admin');
  });

  it('updates existing OAuth user role when configured role changes', async () => {
    const roleUpdates: string[] = [];

    const result = await loginWithOAuthUseCase(
      {
        email: 'existing@example.com',
        name: 'Updated Name',
      },
      {
        createAuthSession: async () => undefined as never,
        createAuthUser: async () => null as never,
        createResourceId: () => 'usr_test',
        createSessionId: () => 'ses_test',
        createUserModel: (user) => ({
          avatar: user.avatar,
          email: user.email,
          id: user.id,
          name: user.name,
          role: user.role,
        }),
        findUserByEmail: async () =>
          authUserRow({
            avatar: null,
            email: 'existing@example.com',
            id: 'usr_existing',
            name: 'Existing User',
            role: 'user',
          }),
        resolveOAuthRole: () => 'admin',
        updateAuthUserProfile: async (id, input) =>
          authUserRow({
            avatar: input.avatar ?? null,
            email: 'existing@example.com',
            id,
            name: input.name,
            role: 'user',
          }),
        updateAuthUserRole: async (id, role) => {
          roleUpdates.push(`${id}:${role}`);
          return authUserRow({
            avatar: null,
            email: 'existing@example.com',
            id,
            name: 'Updated Name',
            role,
          });
        },
      }
    );

    expect(roleUpdates).toStrictEqual(['usr_existing:admin']);
    expect(result.user.role).toBe('admin');
  });
});
