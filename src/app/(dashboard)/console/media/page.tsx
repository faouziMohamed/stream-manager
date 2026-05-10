import { getCloudinarySettings } from '@/lib/db/repositories/settings';
import { MediaLibrary } from '@/modules/settings/client/components/media-library';

export default async function MediaPage() {
  const cloudinary = await getCloudinarySettings();
  const rootFolder = cloudinary.folder ?? 'stream-manager';
  return <MediaLibrary rootFolder={rootFolder} />;
}
