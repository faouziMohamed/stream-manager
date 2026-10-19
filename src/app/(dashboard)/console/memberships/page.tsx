import { Plus } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { ConsoleRefreshButton } from '@/components/console/shared/console-refresh-button';
import { loadMemberships } from '@/features/memberships/server/loaders/memberships.loader';
import { MEMBERSHIPS_QUERY_KEY } from '@/features/memberships/ui/queries/use-memberships.queries';
import { buildMembershipTrend } from '@/features/memberships/shared/membership-trend.mapper';
import { MembershipTrendChart } from '@/features/memberships/ui/components/membership-trend-chart';
import { MembershipsConsole } from '@/features/memberships/ui/components/memberships-console';
import { isCurrentUserAdmin } from '@/lib/auth/current-user';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

export default async function MembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  // Renew, cancel and create are admin mutations. Showing them to an
  // accountant produced a 500 on click; the server still enforces the rule.
  // The role comes from the database, not the JWT, so a promotion applies on
  // the next render instead of the next sign-in.
  const [initialData, canManage] = await Promise.all([
    loadMemberships(customerId),
    isCurrentUserAdmin(),
  ]);
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Memberships"
        description="Track active subscriptions, renewal windows, customer plans, and lifecycle interventions."
        actions={
          <>
            <ConsoleRefreshButton
              ariaLabel="Refresh memberships"
              queryKey={MEMBERSHIPS_QUERY_KEY}
            />
            {canManage ? (
              <Link
                className={cn(buttonVariants({ variant: 'accent', size: 'sm' }), 'gap-2')}
                href={ROUTES.console.newSubscription}
              >
                <Plus className="size-4" />
                New subscription
              </Link>
            ) : null}
          </>
        }
      />

      <MembershipTrendChart series={buildMembershipTrend(initialData.items)} />

      <MembershipsConsole canManage={canManage} customerId={customerId} initialData={initialData} />
    </main>
  );
}
