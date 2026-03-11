export const analyticsSchema = /* GraphQL */ `
  type DashboardStats {
    activeSubscriptions: Int!
    totalClients: Int!
    mrr: Float!
    overdueCount: Int!
    upcomingDueCount: Int!
    currencyCode: String!
  }

  type MonthlyRevenue {
    month: String!
    revenue: Float!
    currencyCode: String!
  }

  type PaymentBreakdown {
    month: String!
    paid: Float!
    unpaid: Float!
    overdue: Float!
    currencyCode: String!
  }

  type SubscriptionsByService {
    serviceName: String!
    count: Int!
    revenue: Float!
    currencyCode: String!
  }

  type AnalyticsData {
    monthlyRevenue: [MonthlyRevenue!]!
    paymentBreakdown: [PaymentBreakdown!]!
    subscriptionsByService: [SubscriptionsByService!]!
  }
`;
