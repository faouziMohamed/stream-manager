import type { Metadata } from "next";
import { db } from "@/lib/db";
import { notificationSettings } from "@/lib/db/tables/subscription-management.table";
import { NotificationsEditor } from "@/components/console/cms/notifications-editor";
import { NOTIFICATION_LABELS } from "@/lib/utils/mailer";
import type { NotificationSettingDto } from "@/lib/graphql/operations/settings.operations";

export const metadata: Metadata = { title: "Notifications — StreamManager" };

export default async function NotificationsSettingsPage() {
  const rows = await db.select().from(notificationSettings);
  const map = new Map(rows.map((r) => [r.event, r]));

  const settings: NotificationSettingDto[] = Object.entries(
    NOTIFICATION_LABELS,
  ).map(([event, label]) => ({
    event,
    label,
    enabled: map.get(event)?.enabled ?? true,
  }));

  return <NotificationsEditor initialData={settings} />;
}
