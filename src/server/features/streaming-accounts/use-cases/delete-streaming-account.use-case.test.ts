import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { StreamingAccountRecord } from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';
import { deleteStreamingAccountUseCase } from '@/server/features/streaming-accounts/use-cases/delete-streaming-account.use-case';

const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_admin',
  user: { avatar: null, email: 'admin@example.com', id: 'usr_admin', name: 'Admin', role: 'admin' },
};

const anonContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: null,
  user: null,
};

const userContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: 'ses_user',
  user: { avatar: null, email: 'user@example.com', id: 'usr_user', name: 'User', role: 'user' },
};

const activeAccount: StreamingAccountRecord = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: null,
  id: 'acc_1',
  isActive: true,
  label: 'Netflix',
  maxProfiles: 4,
  passwordEncrypted: null,
  serviceId: 'svc_1',
  supportsProfiles: true,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const inactiveAccount: StreamingAccountRecord = { ...activeAccount, id: 'acc_2', isActive: false };

describe('deleteStreamingAccountUseCase', () => {
  it('soft-deletes an active account with no active assignments', async () => {
    const result = await deleteStreamingAccountUseCase({ id: 'acc_1' }, adminContext, {
      findProfilesByAccountId: async () => [{ isAssigned: false }],
      findStreamingAccountById: async () => activeAccount,
      softDeleteStreamingAccount: async () => activeAccount,
    });

    expect(result.id).toBe('acc_1');
  });

  it('throws ACCOUNT_NOT_FOUND when account does not exist', async () => {
    await expect(
      deleteStreamingAccountUseCase({ id: 'acc_missing' }, adminContext, {
        findProfilesByAccountId: async () => [],
        findStreamingAccountById: async () => null,
        softDeleteStreamingAccount: async () => null,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_FOUND' });
  });

  it('throws ACCOUNT_NOT_FOUND when account is already inactive', async () => {
    await expect(
      deleteStreamingAccountUseCase({ id: 'acc_2' }, adminContext, {
        findProfilesByAccountId: async () => [],
        findStreamingAccountById: async () => inactiveAccount,
        softDeleteStreamingAccount: async () => null,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNT_NOT_FOUND' });
  });

  it('throws ACCOUNT_HAS_ACTIVE_ASSIGNMENTS when a profile is assigned', async () => {
    await expect(
      deleteStreamingAccountUseCase({ id: 'acc_1' }, adminContext, {
        findProfilesByAccountId: async () => [{ isAssigned: false }, { isAssigned: true }],
        findStreamingAccountById: async () => activeAccount,
        softDeleteStreamingAccount: async () => null,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNT_HAS_ACTIVE_ASSIGNMENTS' });
  });

  it('throws ACCOUNT_DELETE_FAILED when soft-delete returns null', async () => {
    await expect(
      deleteStreamingAccountUseCase({ id: 'acc_1' }, adminContext, {
        findProfilesByAccountId: async () => [{ isAssigned: false }],
        findStreamingAccountById: async () => activeAccount,
        softDeleteStreamingAccount: async () => null,
      })
    ).rejects.toMatchObject({ code: 'ACCOUNT_DELETE_FAILED' });
  });

  it('rejects non-admin users with FORBIDDEN', async () => {
    await expect(
      deleteStreamingAccountUseCase({ id: 'acc_1' }, userContext, {
        findProfilesByAccountId: async () => [],
        findStreamingAccountById: async () => activeAccount,
        softDeleteStreamingAccount: async () => activeAccount,
      })
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('rejects unauthenticated users with UNAUTHENTICATED', async () => {
    await expect(
      deleteStreamingAccountUseCase({ id: 'acc_1' }, anonContext, {
        findProfilesByAccountId: async () => [],
        findStreamingAccountById: async () => activeAccount,
        softDeleteStreamingAccount: async () => activeAccount,
      })
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});
