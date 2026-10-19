import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  RevenueChartDocument,
  type RevenueChartQuery,
  type RevenueChartQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('revenue-chart.loader');

type RevenuePoint = RevenueChartQuery['revenueChart'][number];

export async function loadRevenueChart(months = 6): Promise<RevenuePoint[]> {
  try {
    const session = await auth();

    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading revenue chart');
      return [];
    }

    const data = await gqlRequest<RevenueChartQuery, RevenueChartQueryVariables>(
      RevenueChartDocument,
      { input: { months } }
    );

    return data.revenueChart;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load revenue chart'
    );
    return [];
  }
}
