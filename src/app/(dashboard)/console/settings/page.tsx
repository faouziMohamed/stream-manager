import { getDefaultCurrency } from '@/lib/db/repositories/analytics.repository';
import { SettingsEditor } from '@/modules/settings/client/components/settings-editor';

export default async function SettingsPage() {
  const currency = await getDefaultCurrency();
  return <SettingsEditor defaultCurrency={currency} />;
}
