'use server';

import { loadDashboardStats } from '@/features/analytics/server/loaders/analytics.loader';
import { loadRevenueChart } from '@/features/analytics/server/loaders/revenue-chart.loader';

export async function loadAnalyticsDashboardAction() {
  const [stats, revenueChart] = await Promise.all([loadDashboardStats(), loadRevenueChart()]);

  return { revenueChart, stats };
}
