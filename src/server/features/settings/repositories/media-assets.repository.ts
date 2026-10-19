import { count, desc, eq } from 'drizzle-orm';

import { mediaAssetsTable } from '@/server/lib/db/tables/settings.table';

export type MediaAsset = typeof mediaAssetsTable.$inferSelect;
export type InsertMediaAsset = typeof mediaAssetsTable.$inferInsert;

export async function insertMediaAsset(input: InsertMediaAsset): Promise<MediaAsset | null> {
  const db = await getDb();
  const [asset] = await db.insert(mediaAssetsTable).values(input).returning();
  return asset ?? null;
}

export async function findMediaAssets(input: { page: number; pageSize: number }) {
  const db = await getDb();
  const offset = (input.page - 1) * input.pageSize;
  const [items, totalRows] = await Promise.all([
    db
      .select()
      .from(mediaAssetsTable)
      .orderBy(desc(mediaAssetsTable.createdAt))
      .limit(input.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(mediaAssetsTable),
  ]);

  return { items, total: totalRows[0]?.total ?? 0 };
}

export async function findMediaAssetById(id: string): Promise<MediaAsset | null> {
  const db = await getDb();
  const [asset] = await db
    .select()
    .from(mediaAssetsTable)
    .where(eq(mediaAssetsTable.id, id))
    .limit(1);
  return asset ?? null;
}

export async function deleteMediaAsset(id: string): Promise<MediaAsset | null> {
  const db = await getDb();
  const [asset] = await db.delete(mediaAssetsTable).where(eq(mediaAssetsTable.id, id)).returning();
  return asset ?? null;
}

async function getDb() {
  const { db } = await import('@/server/lib/db/client');
  return db;
}
