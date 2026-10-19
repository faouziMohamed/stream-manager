import { ConsoleMetric } from '@/components/console/shared/console-metric';
import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { ConsoleRefreshButton } from '@/components/console/shared/console-refresh-button';
import { loadServices } from '@/features/services/server/loaders/services.loader';
import { SERVICES_QUERY_KEY } from '@/features/services/ui/queries/use-services.queries';
import { ServicesConsole } from '@/features/services/ui/components/services-console';
import { isCurrentUserAdmin } from '@/lib/auth/current-user';

export default async function ServicesPage() {
  const [{ items, total }, canManage] = await Promise.all([loadServices(), isCurrentUserAdmin()]);
  const activeCount = items.filter((item) => item.isActive).length;
  const supportsProfilesCount = items.filter((item) => item.supportsProfiles).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Services"
        description="Manage streaming providers, profile capabilities, and the catalog used by pricing plans."
        actions={
          <ConsoleRefreshButton ariaLabel="Refresh services" queryKey={SERVICES_QUERY_KEY} />
        }
      />

      <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <ConsoleMetric label="Total services" value={String(total)} />
        <ConsoleMetric label="Active" tone="positive" value={String(activeCount)} />
        <ConsoleMetric
          label="Inactive"
          tone="neutral"
          value={String(Math.max(total - activeCount, 0))}
        />
        <ConsoleMetric label="Supports profiles" value={String(supportsProfilesCount)} />
      </section>

      <ServicesConsole canManage={canManage} initialData={{ items, total }} />
    </main>
  );
}
