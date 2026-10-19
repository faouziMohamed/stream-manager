import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { getStreamingAccountUseCase } from '@/server/features/streaming-accounts/use-cases/get-streaming-account.use-case';

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

const accountRecord = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: 'netflix@example.com',
  id: 'acc_test',
  isActive: true,
  label: 'Netflix Main',
  maxProfiles: 4,
  passwordEncrypted: null,
  serviceId: 'svc_netflix',
  supportsProfiles: true,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
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

describe('getStreamingAccountUseCase', () => {
  it('rejects non-moderator users', async () => {
    let findStreamingAccountByIdCalls = 0;
    let findProfilesByAccountIdCalls = 0;

    await expect(
      getStreamingAccountUseCase('acc_test', userContext, {
        findStreamingAccountById: async () => {
          findStreamingAccountByIdCalls += 1;
          return accountRecord;
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

  it('returns account with profiles for admin', async () => {
    const result = await getStreamingAccountUseCase('acc_test', adminContext, {
      findStreamingAccountById: async () => accountRecord,
      findProfilesByAccountId: async () => [profileRecord],
    });

    expect(result.id).toBe('acc_test');
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0].id).toBe('prf_test');
  });

  it('returns account with profiles for accountant', async () => {
    const result = await getStreamingAccountUseCase('acc_test', accountantContext, {
      findStreamingAccountById: async () => accountRecord,
      findProfilesByAccountId: async () => [profileRecord],
    });

    expect(result.id).toBe('acc_test');
    expect(result.profiles).toHaveLength(1);
  });

  it('throws ACCOUNT_NOT_FOUND when account is null', async () => {
    await expect(
      getStreamingAccountUseCase('acc_missing', adminContext, {
        findStreamingAccountById: async () => null,
        findProfilesByAccountId: async () => [],
      })
    ).rejects.toMatchObject({
      code: 'ACCOUNT_NOT_FOUND',
      statusCode: 404,
    });
  });
});
