import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { ConsoleRefreshButton } from '@/components/console/shared/console-refresh-button';
import { loadPlans } from '@/features/plans/server/loaders/plans.loader';
import { PlansConsole } from '@/features/plans/ui/components/plans-console';
import { PLANS_QUERY_KEY } from '@/features/plans/ui/queries/use-plans.queries';
import { isCurrentUserAdmin } from '@/lib/auth/current-user';

export default async function PlansPage() {
  const [data, canManage] = await Promise.all([loadPlans(), isCurrentUserAdmin()]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Plans"
        description="Define pricing tiers for streaming services. Plans drive membership pricing."
        actions={<ConsoleRefreshButton ariaLabel="Refresh plans" queryKey={PLANS_QUERY_KEY} />}
      />
      <PlansConsole
        canManage={canManage}
        initialData={{ items: data.items, total: data.total }}
        serviceOptions={data.serviceOptions}
      />
    </main>
  );
}
