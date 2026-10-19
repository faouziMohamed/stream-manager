import type { MembershipRecord } from '@/server/features/memberships/schemas/model/memberships.model';
import {
  runMembershipExpiredWorker,
  runMembershipExpiringWorker,
} from '@/server/workers/expiry.worker';

const membershipRecord: MembershipRecord = {
  businessId: 'MBR-2026-0001',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  customerId: 'cst_test',
  endDate: '2026-05-29',
  id: 'mbr_test',
  isRecurring: true,
  planId: 'pln_test',
  renewedFromId: null,
  startDate: '2026-04-29',
  status: 'active',
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('runMembershipExpiringWorker', () => {
  it('counts memberships ending in 3 days', async () => {
    const result = await runMembershipExpiringWorker({
      expireActiveMembershipsEndingOn: async () => [],
      findActiveMembershipsEndingOn: async (endDate) => {
        expect(endDate).toBe('2026-06-01');
        return [membershipRecord];
      },
      getToday: () => '2026-05-29',
      logError: () => null,
      logInfo: () => null,
    });

    expect(result.notifiedCount).toBe(1);
    expect(result.targetDate).toBe('2026-06-01');
  });

  it('calls notifyMembershipLifecycle with MEMBERSHIP_EXPIRING for each membership', async () => {
    const notified: Array<{ event: string; membershipId: string }> = [];

    await runMembershipExpiringWorker({
      expireActiveMembershipsEndingOn: async () => [],
      findActiveMembershipsEndingOn: async () => [membershipRecord],
      getToday: () => '2026-05-29',
      logError: () => null,
      logInfo: () => null,
      notifyMembershipLifecycle: async (event, m) => {
        notified.push({ event, membershipId: m.id });
      },
    });

    expect(notified).toEqual([{ event: 'MEMBERSHIP_EXPIRING', membershipId: 'mbr_test' }]);
  });

  it('does not throw when notifyMembershipLifecycle rejects', async () => {
    await expect(
      runMembershipExpiringWorker({
        expireActiveMembershipsEndingOn: async () => [],
        findActiveMembershipsEndingOn: async () => [membershipRecord],
        getToday: () => '2026-05-29',
        logError: () => null,
        logInfo: () => null,
        notifyMembershipLifecycle: async () => {
          throw new Error('smtp-down');
        },
      })
    ).resolves.toMatchObject({ notifiedCount: 1 });
  });

  it('returns zero when no memberships are expiring', async () => {
    const result = await runMembershipExpiringWorker({
      expireActiveMembershipsEndingOn: async () => [],
      findActiveMembershipsEndingOn: async () => [],
      getToday: () => '2026-05-29',
      logError: () => null,
      logInfo: () => null,
    });

    expect(result.notifiedCount).toBe(0);
  });
});

describe('runMembershipExpiredWorker', () => {
  it('expires memberships ending today', async () => {
    const result = await runMembershipExpiredWorker({
      expireActiveMembershipsEndingOn: async (endDate) => {
        expect(endDate).toBe('2026-05-29');
        return [membershipRecord];
      },
      findActiveMembershipsEndingOn: async () => [],
      getToday: () => '2026-05-29',
      logError: () => null,
      logInfo: () => null,
    });

    expect(result.expiredCount).toBe(1);
    expect(result.targetDate).toBe('2026-05-29');
  });

  it('calls notifyMembershipLifecycle with MEMBERSHIP_EXPIRED for each membership', async () => {
    const notified: Array<{ event: string; membershipId: string }> = [];

    await runMembershipExpiredWorker({
      expireActiveMembershipsEndingOn: async () => [membershipRecord],
      findActiveMembershipsEndingOn: async () => [],
      getToday: () => '2026-05-29',
      logError: () => null,
      logInfo: () => null,
      notifyMembershipLifecycle: async (event, m) => {
        notified.push({ event, membershipId: m.id });
      },
    });

    expect(notified).toEqual([{ event: 'MEMBERSHIP_EXPIRED', membershipId: 'mbr_test' }]);
  });

  it('does not throw when notifyMembershipLifecycle rejects', async () => {
    await expect(
      runMembershipExpiredWorker({
        expireActiveMembershipsEndingOn: async () => [membershipRecord],
        findActiveMembershipsEndingOn: async () => [],
        getToday: () => '2026-05-29',
        logError: () => null,
        logInfo: () => null,
        notifyMembershipLifecycle: async () => {
          throw new Error('smtp-down');
        },
      })
    ).resolves.toMatchObject({ expiredCount: 1 });
  });
});
