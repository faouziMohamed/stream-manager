'use client';

import { useQuery } from '@tanstack/react-query';

import { loadAnalyticsDashboardAction } from '@/features/analytics/server/actions/analytics.action';
import { useAuthRecoveredOperation } from '@/lib/auth/use-auth-recovered-operation';
import type { DashboardStats } from '@/features/analytics/shared/analytics.types';
import type { RevenueChartQuery } from '@/lib/graphql/generated/graphql';

export const ANALYTICS_QUERY_KEY = ['analytics', 'dashboard'] as const;

export type AnalyticsDashboardPayload = {
  revenueChart: RevenueChartQuery['revenueChart'];
  stats: DashboardStats;
};

export function useAnalyticsDashboard(initialData: AnalyticsDashboardPayload) {
  const recoverOperation = useAuthRecoveredOperation();

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEY,
    queryFn: () => recoverOperation(() => loadAnalyticsDashboardAction()),
    initialData,
  });
}
