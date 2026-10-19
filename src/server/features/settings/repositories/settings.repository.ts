import { desc, eq, lt } from 'drizzle-orm';

import { settingsSummaryLinksTable } from '@/server/lib/db/tables/settings.table';

export async function deleteExpiredSummaryLinks(now: Date) {
  const db = await getDb();
  const rows = await db
    .delete(settingsSummaryLinksTable)
    .where(lt(settingsSummaryLinksTable.expiresAt, now))
    .returning({ id: settingsSummaryLinksTable.id });

  return rows.length;
}

export async function createSummaryLink(input: {
  expiresAt?: Date | null;
  id: string;
  label?: string | null;
  token: string;
}): Promise<typeof settingsSummaryLinksTable.$inferSelect | null> {
  const db = await getDb();
  const [row] = await db
    .insert(settingsSummaryLinksTable)
    .values({
      expiresAt: input.expiresAt ?? null,
      id: input.id,
      label: input.label ?? null,
      token: input.token,
    })
    .returning();

  return row ?? null;
}

export async function deleteSummaryLinkById(id: string): Promise<{ id: string } | null> {
  const db = await getDb();
  const [row] = await db
    .delete(settingsSummaryLinksTable)
    .where(eq(settingsSummaryLinksTable.id, id))
    .returning({ id: settingsSummaryLinksTable.id });

  return row ?? null;
}

export async function listSummaryLinks() {
  const db = await getDb();

  return db
    .select()
    .from(settingsSummaryLinksTable)
    .orderBy(desc(settingsSummaryLinksTable.createdAt));
}

export async function findSummaryLinkByToken(
  token: string
): Promise<typeof settingsSummaryLinksTable.$inferSelect | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(settingsSummaryLinksTable)
    .where(eq(settingsSummaryLinksTable.token, token))
    .limit(1);

  return row ?? null;
}

async function getDb() {
  const { db } = await import('@/server/lib/db/client');
  return db;
}
