import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { getDashboardStatsUseCase } from '@/server/features/analytics/use-cases/get-dashboard-stats.use-case';

const authContext: GqlContext = {
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

const statsSnapshot = {
  activeMemberships: 42,
  expiringInSevenDays: 5,
  overduePayments: 3,
  revenueThisMonth: '12500.00',
};

describe('getDashboardStatsUseCase', () => {
  it('returns dashboard stats for authenticated users', async () => {
    const result = await getDashboardStatsUseCase(authContext, {
      getDashboardStatsSnapshot: async () => statsSnapshot,
    });

    expect(result).toEqual(statsSnapshot);
  });

  it('rejects unauthenticated users with UNAUTHENTICATED', async () => {
    await expect(
      getDashboardStatsUseCase(anonContext, {
        getDashboardStatsSnapshot: async () => statsSnapshot,
      })
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});
