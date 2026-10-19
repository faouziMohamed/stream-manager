export interface DashboardStats {
  activeMemberships: number;
  expiringInSevenDays: number;
  overduePayments: number;
  revenueThisMonth: string;
}

export interface RevenueBucket {
  month: string;
  revenue: string;
}

export interface MembershipTimelineItem {
  customerName: string;
  endDate: string;
  id: string;
  planName: string;
  startDate: string;
}
