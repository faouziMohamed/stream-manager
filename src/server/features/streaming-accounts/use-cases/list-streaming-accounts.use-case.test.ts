import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { listStreamingAccountsUseCase } from '@/server/features/streaming-accounts/use-cases/list-streaming-accounts.use-case';

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

const assignmentRecord = {
  accountId: 'acc_test',
  assignedAt: new Date('2026-01-02T00:00:00.000Z'),
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  id: 'asg_test',
  membershipId: 'mbr_test',
  profileId: 'prf_test',
};

describe('listStreamingAccountsUseCase', () => {
  it('rejects non-moderator users', async () => {
    let findStreamingAccountsCalls = 0;
    let findProfilesByAccountIdCalls = 0;

    await expect(
      listStreamingAccountsUseCase(userContext, {
        findStreamingAccounts: async () => {
          findStreamingAccountsCalls += 1;
          return [accountRecord];
        },
        findProfilesByAccountId: async () => {
          findProfilesByAccountIdCalls += 1;
          return [profileRecord];
        },
        findAssignmentsByAccountId: async () => [assignmentRecord],
      })
    ).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
      message: 'Forbidden',
    });

    expect(findStreamingAccountsCalls).toBe(0);
    expect(findProfilesByAccountIdCalls).toBe(0);
  });

  it('returns empty array when no accounts exist', async () => {
    const result = await listStreamingAccountsUseCase(adminContext, {
      findStreamingAccounts: async () => [],
      findProfilesByAccountId: async () => [],
      findAssignmentsByAccountId: async () => [],
    });

    expect(result).toEqual([]);
  });

  it('returns profiles enriched with active assignment identifiers', async () => {
    const result = await listStreamingAccountsUseCase(adminContext, {
      findStreamingAccounts: async () => [accountRecord],
      findProfilesByAccountId: async () => [profileRecord],
      findAssignmentsByAccountId: async () => [assignmentRecord],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('acc_test');
    expect(result[0].profiles).toHaveLength(1);
    expect(result[0].profiles[0].id).toBe('prf_test');
    expect(result[0].profiles[0].assignmentId).toBe('asg_test');
    expect(result[0].profiles[0].membershipId).toBe('mbr_test');
  });

  it('allows accountant access', async () => {
    const result = await listStreamingAccountsUseCase(accountantContext, {
      findStreamingAccounts: async () => [accountRecord],
      findProfilesByAccountId: async () => [profileRecord],
      findAssignmentsByAccountId: async () => [assignmentRecord],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('acc_test');
  });
});
