import { getCloudinarySettings } from '@/lib/db/repositories/settings';
import { CloudinaryEditor } from '@/modules/settings/client/components/cloudinary-editor';

export default async function CloudinarySettingsPage() {
  const cloudinary = await getCloudinarySettings();
  return <CloudinaryEditor initialCloudinary={cloudinary} />;
}
