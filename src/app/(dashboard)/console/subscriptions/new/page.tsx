import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { ForbiddenScreen } from '@/components/shared/forbidden-screen';
import { loadSubscriptionFormOptions } from '@/features/subscriptions/server/loaders/subscription-form.loader';
import { NewSubscriptionForm } from '@/features/subscriptions/ui/components/new-subscription-form';
import { getCurrentConsoleUser } from '@/lib/auth/current-user';

export default async function NewSubscriptionPage() {
  // Creating a subscription and listing available profiles require an admin.
  const user = await getCurrentConsoleUser();

  if (user?.role !== 'admin') {
    return <ForbiddenScreen email={user?.email} role={user?.role} />;
  }

  const { customers, plans } = await loadSubscriptionFormOptions();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="New subscription"
        description="Customer, plan, payment and streaming profile in one step. Everything is saved together or not at all."
      />
      <NewSubscriptionForm customers={customers} plans={plans} />
    </main>
  );
}
