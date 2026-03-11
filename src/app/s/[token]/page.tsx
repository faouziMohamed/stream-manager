import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { summaryLinks } from "@/lib/db/tables/subscription-management.table";
import { eq } from "drizzle-orm";
import {
  getDashboardStats,
  getMonthlyRevenue,
  getPaymentBreakdown,
  getSubscriptionsByService,
} from "@/lib/db/repositories/analytics.repository";
import { SummaryView } from "@/components/console/cms/summary-view";
import type { AnalyticsDto } from "@/lib/graphql/operations/analytics.operations";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharedSummaryPage({ params }: Props) {
  const { token } = await params;

  // Validate the token
  const [link] = await db
    .select()
    .from(summaryLinks)
    .where(eq(summaryLinks.token, token));

  if (!link || !link.isActive) notFound();
  if (link.expiresAt && link.expiresAt < new Date()) notFound();

  // Fetch stats + analytics
  const [stats, monthlyRevenue, paymentBreakdown, subscriptionsByService] = await Promise.all([
    getDashboardStats(),
    getMonthlyRevenue(6),
    getPaymentBreakdown(6),
    getSubscriptionsByService(),
  ]);

  const analytics: AnalyticsDto = { monthlyRevenue, paymentBreakdown, subscriptionsByService };

  return (
    <div className="min-h-screen bg-background">
      <SummaryView
        stats={stats}
        analytics={analytics}
        showSensitiveInfo={link.showSensitiveInfo}
        label={link.label}
      />
    </div>
  );
}
