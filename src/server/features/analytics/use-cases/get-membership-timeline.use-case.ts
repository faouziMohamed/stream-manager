import { requireAuth } from '@/server/features/common/guards/require-auth.guard';
import { getMembershipTimelineRows } from '@/server/features/analytics/repositories/analytics.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

export async function getMembershipTimelineUseCase(
  context: GqlContext,
  dependencies: GetMembershipTimelineDependencies = defaultDependencies
) {
  requireAuth(context);
  return dependencies.getMembershipTimelineRows();
}

interface GetMembershipTimelineDependencies {
  getMembershipTimelineRows: typeof getMembershipTimelineRows;
}

const defaultDependencies: GetMembershipTimelineDependencies = {
  getMembershipTimelineRows,
};
