import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { MembershipRecord } from '@/server/features/memberships/use-cases/membership-records.model';
import {
  getMembershipUseCase,
  getMembershipsUseCase,
} from '@/server/features/memberships/use-cases/get-memberships.use-case';

const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_admin',
  user: { avatar: null, email: 'admin@example.com', id: 'usr_admin', name: 'Admin', role: 'admin' },
};

const accountantContext: GqlContext = {
  isAccountant: true,
  isAdmin: false,
  sessionId: 'ses_acct',
  user: {
    avatar: null,
    email: 'acct@example.com',
    id: 'usr_acct',
    name: 'Accountant',
    role: 'accountant',
  },
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

const membershipRecord: MembershipRecord = {
  businessId: 'MBR-2026-0001',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  customerId: 'cst_1',
  endDate: '2027-01-01',
  id: 'mbr_1',
  isRecurring: false,
  planId: 'pln_1',
  renewedFromId: null,
  startDate: '2026-01-01',
  status: 'active',
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const baseFilters = { page: 1, pageSize: 20 };

describe('getMembershipsUseCase', () => {
  it('returns paginated memberships for admin', async () => {
    const result = await getMembershipsUseCase(baseFilters, adminContext, {
      findMemberships: async () => ({ items: [membershipRecord], total: 1 }),
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('mbr_1');
    expect(result.pageInfo.total).toBe(1);
  });

  it('returns paginated memberships for accountant', async () => {
    const result = await getMembershipsUseCase(baseFilters, accountantContext, {
      findMemberships: async () => ({ items: [], total: 0 }),
    });

    expect(result.items).toHaveLength(0);
  });

  it('maps record fields to DTO (ISO string dates)', async () => {
    const result = await getMembershipsUseCase(baseFilters, adminContext, {
      findMemberships: async () => ({ items: [membershipRecord], total: 1 }),
    });

    const dto = result.items[0];
    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.businessId).toBe('MBR-2026-0001');
  });

  it('rejects plain users with FORBIDDEN', async () => {
    await expect(
      getMembershipsUseCase(baseFilters, userContext, {
        findMemberships: async () => ({ items: [], total: 0 }),
      })
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('rejects unauthenticated users with UNAUTHENTICATED', async () => {
    await expect(
      getMembershipsUseCase(baseFilters, anonContext, {
        findMemberships: async () => ({ items: [], total: 0 }),
      })
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});

describe('getMembershipUseCase', () => {
  it('returns a membership DTO for admin', async () => {
    const result = await getMembershipUseCase('mbr_1', adminContext, {
      findMembershipById: async () => membershipRecord,
    });

    expect(result.id).toBe('mbr_1');
  });

  it('throws MEMBERSHIP_NOT_FOUND when membership does not exist', async () => {
    await expect(
      getMembershipUseCase('mbr_missing', adminContext, {
        findMembershipById: async () => null,
      })
    ).rejects.toMatchObject({ code: 'MEMBERSHIP_NOT_FOUND' });
  });

  it('rejects unauthenticated users with UNAUTHENTICATED', async () => {
    await expect(
      getMembershipUseCase('mbr_1', anonContext, {
        findMembershipById: async () => membershipRecord,
      })
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});
