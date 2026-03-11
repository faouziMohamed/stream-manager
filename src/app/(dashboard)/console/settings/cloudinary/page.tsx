import {getCloudinarySettings} from '@/lib/db/repositories/settings.repository';
import {CloudinaryEditor} from '@/components/console/cms/cloudinary-editor';

export default async function CloudinarySettingsPage() {
    const cloudinary = await getCloudinarySettings();
    return <CloudinaryEditor initialCloudinary={cloudinary}/>;
}
