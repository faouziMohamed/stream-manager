import { SmtpEditor } from '@/modules/settings/client/components/smtp-editor';
import { getSmtpSettings } from '@/lib/db/repositories/settings';

export default async function SmtpSettingsPage() {
  const smtp = await getSmtpSettings();
  return <SmtpEditor initialSmtp={smtp} />;
}
