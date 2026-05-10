import { requireAuth } from '@/lib/graphql/resolvers/guards';
import {
  getDashboardStats,
  getMonthlyRevenue,
  getPaymentBreakdown,
  getSubscriptionsByService,
} from '@/modules/analytics/server/repositories/analytics.repository';
import type { GraphQLContext } from '@/lib/graphql/context';

export const analyticsResolvers = {
  Query: {
    dashboardStats: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return getDashboardStats();
    },
    analytics: async (_: unknown, { months }: { months?: number }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const n = months ?? 12;
      const [monthlyRevenue, paymentBreakdown, subscriptionsByService] = await Promise.all([
        getMonthlyRevenue(n),
        getPaymentBreakdown(n),
        getSubscriptionsByService(),
      ]);
      return { monthlyRevenue, paymentBreakdown, subscriptionsByService };
    },
  },
};
