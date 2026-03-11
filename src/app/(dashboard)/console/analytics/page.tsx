import {
    getMonthlyRevenue,
    getPaymentBreakdown,
    getSubscriptionsByService
} from '@/lib/db/repositories/analytics.repository';
import {AnalyticsDashboard} from '@/components/console/cms/analytics-dashboard';
import type {AnalyticsDto} from '@/lib/graphql/operations/analytics.operations';

export default async function AnalyticsPage() {
    const [monthlyRevenue, paymentBreakdown, subscriptionsByService] = await Promise.all([
        getMonthlyRevenue(6),
        getPaymentBreakdown(6),
        getSubscriptionsByService(),
    ]);

    const initialData: AnalyticsDto = {monthlyRevenue, paymentBreakdown, subscriptionsByService};

    return <AnalyticsDashboard initialData={initialData}/>;
}
