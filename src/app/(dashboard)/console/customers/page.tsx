import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { ConsoleRefreshButton } from '@/components/console/shared/console-refresh-button';
import { loadCustomers } from '@/features/customers/server/loaders/customers.loader';
import { CUSTOMERS_QUERY_KEY } from '@/features/customers/ui/queries/use-customers.queries';
import { CustomerList } from '@/features/customers/ui/components/customer-list';
import { isCurrentUserAdmin } from '@/lib/auth/current-user';

export default async function CustomersPage() {
  const [initialData, canManage] = await Promise.all([loadCustomers(), isCurrentUserAdmin()]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Customers"
        description="Manage customer identities, contact details, and the relationships behind active memberships."
        actions={
          <ConsoleRefreshButton ariaLabel="Refresh customers" queryKey={CUSTOMERS_QUERY_KEY} />
        }
      />

      <div className="mt-6">
        <CustomerList canManage={canManage} initialData={initialData} />
      </div>
    </main>
  );
}
