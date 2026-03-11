import { requireAuth } from "./guards";
import {
  getDashboardStats,
  getMonthlyRevenue,
  getPaymentBreakdown,
  getSubscriptionsByService,
} from "@/lib/db/repositories/analytics.repository";
import type { GraphQLContext } from "../context";

export const analyticsResolvers = {
  Query: {
    dashboardStats: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return getDashboardStats();
    },
    analytics: async (
      _: unknown,
      { months }: { months?: number },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const n = months ?? 12;
      const [monthlyRevenue, paymentBreakdown, subscriptionsByService] =
        await Promise.all([
          getMonthlyRevenue(n),
          getPaymentBreakdown(n),
          getSubscriptionsByService(),
        ]);
      return { monthlyRevenue, paymentBreakdown, subscriptionsByService };
    },
  },
};
