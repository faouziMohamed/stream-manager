import {getCloudinarySettings} from '@/lib/db/repositories/settings.repository';
import {MediaLibrary} from '@/components/console/cms/media-library';

export default async function MediaPage() {
    const cloudinary = await getCloudinarySettings();
    const rootFolder = cloudinary.folder ?? 'streammanager';
    return <MediaLibrary rootFolder={rootFolder}/>;
}
