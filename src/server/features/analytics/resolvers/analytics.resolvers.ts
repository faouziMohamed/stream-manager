import { validateInput } from '@/server/features/common/middleware/validate-input';
import { getDashboardStatsUseCase } from '@/server/features/analytics/use-cases/get-dashboard-stats.use-case';
import { getMembershipTimelineUseCase } from '@/server/features/analytics/use-cases/get-membership-timeline.use-case';
import { getRevenueChartUseCase } from '@/server/features/analytics/use-cases/get-revenue-chart.use-case';
import { revenueChartInputSchema } from '@/server/features/analytics/schemas/validators/analytics.validators';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

export const analyticsResolvers = {
  Query: {
    async dashboardStats(_parent: unknown, _args: unknown, context: GqlContext) {
      return getDashboardStatsUseCase(context);
    },
    async membershipTimeline(_parent: unknown, _args: unknown, context: GqlContext) {
      return getMembershipTimelineUseCase(context);
    },
    async revenueChart(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(revenueChartInputSchema, args.input ?? {});
      return getRevenueChartUseCase(input, context);
    },
  },
};

interface ResolverArgs<TInput> {
  input?: TInput;
}
