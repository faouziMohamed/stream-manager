import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { ConsoleRefreshButton } from '@/components/console/shared/console-refresh-button';
import { ForbiddenScreen } from '@/components/shared/forbidden-screen';
import { loadSummaryLinks } from '@/features/summary/server/loaders/summary.loader';
import { SUMMARY_LINKS_QUERY_KEY } from '@/features/summary/ui/queries/use-summary-links.queries';
import { SummaryLinksConsole } from '@/features/summary/ui/components/summary-links-console';
import { getCurrentConsoleUser } from '@/lib/auth/current-user';

export default async function SummaryPage() {
  // Listing summary links requires `requireAdmin`, and so do generate/revoke.
  const user = await getCurrentConsoleUser();

  if (user?.role !== 'admin') {
    return <ForbiddenScreen email={user?.email} role={user?.role} />;
  }

  const { items } = await loadSummaryLinks();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Summary"
        description="Create controlled summary links for accountants, customer follow-ups, and external reviews."
        actions={
          <ConsoleRefreshButton
            ariaLabel="Refresh summary links"
            queryKey={SUMMARY_LINKS_QUERY_KEY}
          />
        }
      />

      <SummaryLinksConsole initialData={{ items }} />
    </main>
  );
}
