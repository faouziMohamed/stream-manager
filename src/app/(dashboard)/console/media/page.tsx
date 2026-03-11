import { getCloudinarySettings } from "@/lib/db/repositories/settings";
import { MediaLibrary } from "@/components/console/cms/media-library";

export default async function MediaPage() {
  const cloudinary = await getCloudinarySettings();
  const rootFolder = cloudinary.folder ?? "stream-manager";
  return <MediaLibrary rootFolder={rootFolder} />;
}
