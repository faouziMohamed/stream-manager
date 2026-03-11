import {
    getDashboardStats,
    getMonthlyRevenue,
    getPaymentBreakdown,
    getSubscriptionsByService
} from '@/lib/db/repositories/analytics.repository';
import {SummaryView} from '@/components/console/cms/summary-view';
import {SummaryLinksManager} from '@/components/console/cms/summary-links-manager';
import type {AnalyticsDto} from '@/lib/graphql/operations/analytics.operations';

export default async function SummaryPage() {
    const [stats, monthlyRevenue, paymentBreakdown, subscriptionsByService] = await Promise.all([
        getDashboardStats(),
        getMonthlyRevenue(6),
        getPaymentBreakdown(6),
        getSubscriptionsByService(),
    ]);

    const analytics: AnalyticsDto = {monthlyRevenue, paymentBreakdown, subscriptionsByService};

    return (
        <div className="space-y-8">
            {/* Admin live preview */}
            <div className="space-y-2">
                <h1 className="text-2xl font-bold">Résumé & Liens de partage</h1>
                <p className="text-muted-foreground text-sm">
                    Prévisualisation du résumé public. Gérez vos liens de partage ci-dessous.
                </p>
            </div>

            {/* Summary link manager */}
            <SummaryLinksManager/>

            {/* Live preview */}
            <div className="border rounded-xl overflow-hidden">
                <div className="bg-muted/40 px-4 py-2 text-xs text-muted-foreground font-medium border-b">
                    Aperçu du résumé partagé (informations sensibles visibles)
                </div>
                <SummaryView
                    stats={stats}
                    analytics={analytics}
                    showSensitiveInfo={true}
                    label="Aperçu administrateur"
                />
            </div>
        </div>
    );
}
