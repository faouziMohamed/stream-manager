import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { ConsoleRefreshButton } from '@/components/console/shared/console-refresh-button';
import { loadStreamingAccounts } from '@/features/streaming-accounts/server/loaders/streaming-accounts.loader';
import { STREAMING_ACCOUNTS_QUERY_KEY } from '@/features/streaming-accounts/ui/queries/use-streaming-accounts.queries';
import { StreamingAccountsConsole } from '@/features/streaming-accounts/ui/components/streaming-accounts-console';
import { isCurrentUserAdmin } from '@/lib/auth/current-user';

export default async function StreamingAccountsPage() {
  const [{ items, membershipOptions, serviceOptions, total }, canManage] = await Promise.all([
    loadStreamingAccounts(),
    isCurrentUserAdmin(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Streaming Accounts"
        description="Control shared account inventory, available profile capacity, and membership assignments."
        actions={
          <ConsoleRefreshButton
            ariaLabel="Refresh streaming accounts"
            queryKey={STREAMING_ACCOUNTS_QUERY_KEY}
          />
        }
      />

      <StreamingAccountsConsole
        canManage={canManage}
        initialData={{ items, total }}
        membershipOptions={membershipOptions}
        serviceOptions={serviceOptions}
      />
    </main>
  );
}
