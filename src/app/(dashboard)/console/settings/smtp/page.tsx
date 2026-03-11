import { getSmtpSettings } from "@/lib/db/repositories/settings.repository";
import { SmtpEditor } from "@/components/console/cms/smtp-editor";

export default async function SmtpSettingsPage() {
  const smtp = await getSmtpSettings();
  return <SmtpEditor initialSmtp={smtp} />;
}
