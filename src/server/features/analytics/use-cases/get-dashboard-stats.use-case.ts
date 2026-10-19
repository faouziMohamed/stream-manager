import { requireAuth } from '@/server/features/common/guards/require-auth.guard';
import { getDashboardStatsSnapshot } from '@/server/features/analytics/repositories/analytics.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

export async function getDashboardStatsUseCase(
  context: GqlContext,
  dependencies: GetDashboardStatsDependencies = defaultDependencies
) {
  requireAuth(context);
  return dependencies.getDashboardStatsSnapshot();
}

interface GetDashboardStatsDependencies {
  getDashboardStatsSnapshot: typeof getDashboardStatsSnapshot;
}

const defaultDependencies: GetDashboardStatsDependencies = {
  getDashboardStatsSnapshot,
};
