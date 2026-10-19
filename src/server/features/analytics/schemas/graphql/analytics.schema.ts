export const analyticsTypeDefs = /* GraphQL */ `
  type DashboardStats {
    activeMemberships: Int!
    revenueThisMonth: String!
    overduePayments: Int!
    expiringInSevenDays: Int!
  }

  type RevenueChartPoint {
    month: String!
    revenue: String!
  }

  type MembershipTimelineItem {
    id: ID!
    customerName: String!
    planName: String!
    startDate: String!
    endDate: String!
  }

  input RevenueChartInput {
    months: Int
  }

  extend type Query {
    dashboardStats: DashboardStats!
    revenueChart(input: RevenueChartInput): [RevenueChartPoint!]!
    membershipTimeline: [MembershipTimelineItem!]!
  }
`;
