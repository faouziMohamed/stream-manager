import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { listStreamingProfilesUseCase } from '@/server/features/streaming-accounts/use-cases/list-streaming-profiles.use-case';

const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_admin',
  user: {
    avatar: null,
    email: 'admin@example.com',
    id: 'usr_admin',
    name: 'Admin',
    role: 'admin',
  },
};

const userContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: 'ses_user',
  user: {
    avatar: null,
    email: 'user@example.com',
    id: 'usr_user',
    name: 'User',
    role: 'user',
  },
};

const accountantContext: GqlContext = {
  isAccountant: true,
  isAdmin: false,
  sessionId: 'ses_accountant',
  user: {
    avatar: null,
    email: 'accountant@example.com',
    id: 'usr_accountant',
    name: 'Accountant',
    role: 'accountant',
  },
};

const profileRecord = {
  accountId: 'acc_test',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  id: 'prf_test',
  isAssigned: false,
  name: 'Profile 1',
  pinEncrypted: null,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('listStreamingProfilesUseCase', () => {
  it('rejects non-moderator users', async () => {
    let findStreamingAccountByIdCalls = 0;
    let findProfilesByAccountIdCalls = 0;

    await expect(
      listStreamingProfilesUseCase('acc_test', userContext, {
        findStreamingAccountById: async () => {
          findStreamingAccountByIdCalls += 1;
          return { id: 'acc_test' };
        },
        findProfilesByAccountId: async () => {
          findProfilesByAccountIdCalls += 1;
          return [profileRecord];
        },
      })
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });

    expect(findStreamingAccountByIdCalls).toBe(0);
    expect(findProfilesByAccountIdCalls).toBe(0);
  });

  it('returns profiles for existing account', async () => {
    const result = await listStreamingProfilesUseCase('acc_test', adminContext, {
      findStreamingAccountById: async () => ({ id: 'acc_test' }),
      findProfilesByAccountId: async () => [profileRecord],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('prf_test');
  });

  it('throws ACCOUNT_NOT_FOUND when account is null', async () => {
    await expect(
      listStreamingProfilesUseCase('acc_missing', adminContext, {
        findStreamingAccountById: async () => null,
        findProfilesByAccountId: async () => [],
      })
    ).rejects.toMatchObject({
      code: 'ACCOUNT_NOT_FOUND',
      statusCode: 404,
    });
  });

  it('returns empty array when account has no profiles', async () => {
    const result = await listStreamingProfilesUseCase('acc_test', adminContext, {
      findStreamingAccountById: async () => ({ id: 'acc_test' }),
      findProfilesByAccountId: async () => [],
    });

    expect(result).toEqual([]);
  });

  it('allows accountant access', async () => {
    const result = await listStreamingProfilesUseCase('acc_test', accountantContext, {
      findStreamingAccountById: async () => ({ id: 'acc_test' }),
      findProfilesByAccountId: async () => [profileRecord],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('prf_test');
  });
});
