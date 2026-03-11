import {getDefaultCurrency} from '@/lib/db/repositories/analytics.repository';
import {SettingsEditor} from '@/components/console/cms/settings-editor';

export default async function SettingsPage() {
    const currency = await getDefaultCurrency();
    return <SettingsEditor defaultCurrency={currency}/>;
}
