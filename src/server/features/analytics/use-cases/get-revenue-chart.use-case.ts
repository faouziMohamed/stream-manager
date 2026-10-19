import { requireAuth } from '@/server/features/common/guards/require-auth.guard';
import { getRevenueBuckets } from '@/server/features/analytics/repositories/analytics.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { RevenueChartInput } from '@/server/features/analytics/schemas/validators/analytics.validators';

export async function getRevenueChartUseCase(
  input: RevenueChartInput,
  context: GqlContext,
  dependencies: GetRevenueChartDependencies = defaultDependencies
) {
  requireAuth(context);
  const rows = await dependencies.getRevenueBuckets(input.months);
  const map = new Map(rows.map((row) => [row.month, row.revenue]));

  return buildMonthRange(input.months).map((month) => ({
    month: MONTH_NAMES[new Date(`${month}-01T00:00:00.000Z`).getUTCMonth()] ?? month,
    revenue: map.get(month) ?? '0',
  }));
}

interface GetRevenueChartDependencies {
  getRevenueBuckets: (months: number) => Promise<Array<{ month: string; revenue: string }>>;
}

const defaultDependencies: GetRevenueChartDependencies = {
  getRevenueBuckets,
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function buildMonthRange(months: number): string[] {
  const cursor = new Date();
  cursor.setUTCDate(1);
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCMonth(cursor.getUTCMonth() - (months - 1));
  const result: string[] = [];

  for (let index = 0; index < months; index += 1) {
    const year = cursor.getUTCFullYear();
    const month = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    result.push(`${year}-${month}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return result;
}
