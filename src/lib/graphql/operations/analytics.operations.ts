// Analytics GraphQL operations
export const GET_DASHBOARD_STATS = /* GraphQL */ `
  query GetDashboardStats {
    dashboardStats {
      activeSubscriptions
      totalClients
      mrr
      overdueCount
      upcomingDueCount
      currencyCode
    }
  }
`;

export const GET_ANALYTICS = /* GraphQL */ `
  query GetAnalytics($months: Int) {
    analytics(months: $months) {
      monthlyRevenue {
        month
        revenue
        currencyCode
      }
      paymentBreakdown {
        month
        paid
        unpaid
        overdue
        currencyCode
      }
      subscriptionsByService {
        serviceName
        count
        revenue
        currencyCode
      }
    }
  }
`;

export interface DashboardStatsDto {
  activeSubscriptions: number;
  totalClients: number;
  mrr: number;
  overdueCount: number;
  upcomingDueCount: number;
  currencyCode: string;
}

export interface MonthlyRevenueDto {
  month: string;
  revenue: number;
  currencyCode: string;
}

export interface PaymentBreakdownDto {
  month: string;
  paid: number;
  unpaid: number;
  overdue: number;
  currencyCode: string;
}

export interface SubscriptionsByServiceDto {
  serviceName: string;
  count: number;
  revenue: number;
  currencyCode: string;
}

export interface AnalyticsDto {
  monthlyRevenue: MonthlyRevenueDto[];
  paymentBreakdown: PaymentBreakdownDto[];
  subscriptionsByService: SubscriptionsByServiceDto[];
}
