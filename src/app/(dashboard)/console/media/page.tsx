import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { ForbiddenScreen } from '@/components/shared/forbidden-screen';
import { loadMediaAssets } from '@/features/settings/server/loaders/media-assets.loader';
import { MediaLibrary } from '@/features/settings/ui/components/media-library';
import { getCurrentConsoleUser } from '@/lib/auth/current-user';

export default async function MediaPage() {
  // Listing, uploading and deleting media all require an administrator.
  const user = await getCurrentConsoleUser();

  if (user?.role !== 'admin') {
    return <ForbiddenScreen email={user?.email} role={user?.role} />;
  }

  const initialData = await loadMediaAssets();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Media"
        description="Manage reusable uploads, streaming service artwork, and the visual assets used across the product."
      />

      <MediaLibrary initialData={initialData} />
    </main>
  );
}
