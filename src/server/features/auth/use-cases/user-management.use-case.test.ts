import {
  deleteUserUseCase,
  listUsersUseCase,
  updateUserRoleUseCase,
} from '@/server/features/auth/use-cases/user-management.use-case';

const userRecord = {
  avatar: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: 'user@example.com',
  id: 'usr_1',
  name: 'User One',
  passwordHash: null,
  role: 'user' as const,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('listUsersUseCase', () => {
  it('returns mapped user DTOs', async () => {
    const result = await listUsersUseCase({
      listAuthUsers: async () => [userRecord],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('usr_1');
    expect(result[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result[0].updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns empty array when no users exist', async () => {
    const result = await listUsersUseCase({
      listAuthUsers: async () => [],
    });

    expect(result).toHaveLength(0);
  });
});

describe('updateUserRoleUseCase', () => {
  it('updates and returns the user with the new role', async () => {
    const updatedRecord = { ...userRecord, role: 'admin' as const };

    const result = await updateUserRoleUseCase(
      { id: 'usr_1', role: 'admin' },
      {
        findUserById: async () => userRecord,
        updateAuthUserRole: async () => updatedRecord,
      }
    );

    expect(result.id).toBe('usr_1');
    expect(result.role).toBe('admin');
  });

  it('throws NOT_FOUND when user does not exist', async () => {
    await expect(
      updateUserRoleUseCase(
        { id: 'usr_missing', role: 'admin' },
        {
          findUserById: async () => null,
          updateAuthUserRole: async () => null,
        }
      )
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws INTERNAL_ERROR when update returns null', async () => {
    await expect(
      updateUserRoleUseCase(
        { id: 'usr_1', role: 'admin' },
        {
          findUserById: async () => userRecord,
          updateAuthUserRole: async () => null,
        }
      )
    ).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
  });
});

describe('deleteUserUseCase', () => {
  it('deletes the user and returns minimal DTO', async () => {
    const result = await deleteUserUseCase('usr_1', {
      deleteAuthUser: async () => userRecord,
      findUserById: async () => userRecord,
    });

    expect(result.id).toBe('usr_1');
    expect(result.email).toBe('user@example.com');
    expect(result.name).toBe('User One');
  });

  it('throws NOT_FOUND when user does not exist', async () => {
    await expect(
      deleteUserUseCase('usr_missing', {
        deleteAuthUser: async () => null,
        findUserById: async () => null,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws INTERNAL_ERROR when delete returns null', async () => {
    await expect(
      deleteUserUseCase('usr_1', {
        deleteAuthUser: async () => null,
        findUserById: async () => userRecord,
      })
    ).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
  });
});
