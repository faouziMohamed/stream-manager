import type { DashboardStats } from '@/features/analytics/shared/analytics.types';
import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  DashboardStatsDocument,
  type DashboardStatsQuery,
  type DashboardStatsQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('analytics.loader');

const defaultStats: DashboardStats = {
  activeMemberships: 0,
  monthlyRevenue: 0,
  overdueCount: 0,
  expiringCount: 0,
};

export async function loadDashboardStats(): Promise<DashboardStats> {
  try {
    const session = await auth();

    if (session === null || session.user?.id === undefined) {
      log.warn('No session found when loading dashboard stats');
      return defaultStats;
    }

    const data = await gqlRequest<DashboardStatsQuery, DashboardStatsQueryVariables>(
      DashboardStatsDocument,
      {}
    );

    const stats = data.dashboardStats;

    const result: DashboardStats = {
      activeMemberships: stats.activeMemberships ?? 0,
      monthlyRevenue:
        stats.revenueThisMonth === undefined ? 0 : Number.parseFloat(stats.revenueThisMonth),
      overdueCount: stats.overduePayments ?? 0,
      expiringCount: stats.expiringInSevenDays ?? 0,
    };

    log.info({ stats: result }, 'Dashboard stats loaded successfully');
    return result;
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to load dashboard stats'
    );
    return defaultStats;
  }
}
