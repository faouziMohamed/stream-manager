import { desc } from 'drizzle-orm';

import { notificationsEventsTable } from '@/server/lib/db/tables/settings.table';

export async function logNotificationEvent(input: NotificationEventLogInput) {
  const db = await getDb();
  const [row] = await db
    .insert(notificationsEventsTable)
    .values({
      errorMessage: input.errorMessage ?? null,
      event: input.event,
      id: input.id,
      recipient: input.recipient,
      status: input.status,
    })
    .returning();

  return row ?? null;
}

export async function getNotificationEvents(page: number, pageSize: number) {
  const db = await getDb();
  const offset = (page - 1) * pageSize;
  return db
    .select()
    .from(notificationsEventsTable)
    .orderBy(desc(notificationsEventsTable.sentAt))
    .limit(pageSize)
    .offset(offset);
}

async function getDb() {
  const { db } = await import('@/server/lib/db/client');
  return db;
}

interface NotificationEventLogInput {
  errorMessage?: string | null;
  event: string;
  id: string;
  recipient: string;
  status: 'sent' | 'failed';
}
