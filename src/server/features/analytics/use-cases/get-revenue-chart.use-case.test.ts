import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { getRevenueChartUseCase } from '@/server/features/analytics/use-cases/get-revenue-chart.use-case';

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

describe('getRevenueChartUseCase', () => {
  it('returns one entry per month in the requested range', async () => {
    const result = await getRevenueChartUseCase({ months: 3 }, authContext, {
      getRevenueBuckets: async () => [],
    });

    expect(result).toHaveLength(3);
  });

  it('fills in zero revenue for months without data', async () => {
    const result = await getRevenueChartUseCase({ months: 2 }, authContext, {
      getRevenueBuckets: async () => [],
    });

    expect(result.every((r) => r.revenue === '0')).toBe(true);
  });

  it('uses revenue from repository when available', async () => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const currentMonth = `${year}-${month}`;

    const result = await getRevenueChartUseCase({ months: 1 }, authContext, {
      getRevenueBuckets: async () => [{ month: currentMonth, revenue: '9999.00' }],
    });

    expect(result).toHaveLength(1);
    expect(result[0].revenue).toBe('9999.00');
  });

  it('maps month keys to short month names', async () => {
    const result = await getRevenueChartUseCase({ months: 1 }, authContext, {
      getRevenueBuckets: async () => [],
    });

    const validNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    expect(validNames).toContain(result[0].month);
  });

  it('rejects unauthenticated users with UNAUTHENTICATED', async () => {
    await expect(
      getRevenueChartUseCase({ months: 3 }, anonContext, { getRevenueBuckets: async () => [] })
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});
