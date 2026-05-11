import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { summaryLinks } from '@/lib/db/tables/subscription-management.table';
import { eq } from 'drizzle-orm';
import {
  getDashboardStats,
  getMonthlyRevenue,
  getPaymentBreakdown,
  getSubscriptionsByService,
} from '@/lib/db/repositories/analytics.repository';
import { SummaryView } from '@/modules/settings/client/components/summary-view';
import { SharedSummaryHeader } from '@/components/shared/shared-summary-header';
import type { AnalyticsDto } from '@/lib/graphql/operations/analytics.operations';
import { SEO, ogImageUrl } from '@/modules/seo/client/helpers/social-card';

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const [link] = await db.select().from(summaryLinks).where(eq(summaryLinks.token, token));
  if (!link || !link.isActive) return { title: 'Lien introuvable' };
  const title = `Rapport — ${link.label} — ${SEO.siteName}`;
  return {
    title,
    description: 'Rapport de gestion des abonnements streaming.',
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description: 'Rapport de gestion des abonnements streaming.',
      images: [{ url: ogImageUrl(title, 'Rapport de gestion des abonnements streaming.') }],
    },
  };
}

export default async function SharedSummaryPage({ params }: Props) {
  const { token } = await params;

  // Validate the token
  const [link] = await db.select().from(summaryLinks).where(eq(summaryLinks.token, token));

  if (!link || !link.isActive) notFound();
  if (link.expiresAt && link.expiresAt < new Date()) notFound();

  // Fetch stats + analytics
  const [stats, monthlyRevenue, paymentBreakdown, subscriptionsByService] = await Promise.all([
    getDashboardStats(),
    getMonthlyRevenue(6),
    getPaymentBreakdown(6),
    getSubscriptionsByService(),
  ]);

  const analytics: AnalyticsDto = {
    monthlyRevenue,
    paymentBreakdown,
    subscriptionsByService,
  };

  return (
    <div className="bg-background min-h-screen">
      <SharedSummaryHeader label={link.label} />
      <SummaryView
        stats={stats}
        analytics={analytics}
        showSensitiveInfo={link.showSensitiveInfo}
        label={link.label}
      />
    </div>
  );
}
