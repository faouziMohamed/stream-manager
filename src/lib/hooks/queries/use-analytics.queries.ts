"use client";

import { useQuery, type QueryKey } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql/client";
import {
  GET_DASHBOARD_STATS,
  GET_ANALYTICS,
  type DashboardStatsDto,
  type AnalyticsDto,
} from "@/lib/graphql/operations/analytics.operations";

export const analyticsKeys = {
  stats: ["dashboardStats"] as QueryKey,
  analytics: (months?: number) => ["analytics", months] as QueryKey,
};

export function useDashboardStats(initialData?: DashboardStatsDto) {
  return useQuery({
    queryKey: analyticsKeys.stats,
    queryFn: () =>
      gqlRequest<{ dashboardStats: DashboardStatsDto }>(
        GET_DASHBOARD_STATS,
      ).then((r) => r.dashboardStats),
    initialData,
    staleTime: 30_000, // 30s — stats can be slightly stale
  });
}

export function useAnalytics(months?: number, initialData?: AnalyticsDto) {
  return useQuery({
    queryKey: analyticsKeys.analytics(months),
    queryFn: () =>
      gqlRequest<{ analytics: AnalyticsDto }>(GET_ANALYTICS, { months }).then(
        (r) => r.analytics,
      ),
    initialData,
    staleTime: 60_000, // 1 minute
  });
}
