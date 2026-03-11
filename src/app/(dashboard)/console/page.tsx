import { getDashboardStats } from '@/lib/db/repositories/analytics.repository';
import { DashboardStats } from '@/components/console/cms/dashboard-stats';

export default async function ConsoleDashboard() {
  const stats = await getDashboardStats();
  return <DashboardStats initialData={stats} />;
}
