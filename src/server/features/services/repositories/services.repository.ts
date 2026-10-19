import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';

import {
  membershipsTable,
  plansTable,
  servicesTable,
} from '@/server/lib/db/tables/membership-management.table';

export async function insertService(input: InsertServiceInput) {
  const db = await getDb();
  const [service] = await db.insert(servicesTable).values(input).returning();

  return service ?? null;
}

export async function findServiceById(id: string) {
  const db = await getDb();
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, id)).limit(1);

  return service ?? null;
}

export async function findServiceByName(name: string) {
  const db = await getDb();
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.name, name))
    .limit(1);

  return service ?? null;
}

export async function findServicesByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  const db = await getDb();

  return db.select().from(servicesTable).where(inArray(servicesTable.id, ids));
}

export async function findServices(input: FindServicesInput) {
  const db = await getDb();
  const offset = (input.page - 1) * input.pageSize;
  const whereActive = isNull(servicesTable.deletedAt);

  const [items, totalRows] = await Promise.all([
    db
      .select()
      .from(servicesTable)
      .where(whereActive)
      .orderBy(desc(servicesTable.createdAt))
      .limit(input.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(servicesTable).where(whereActive),
  ]);

  return {
    items,
    total: totalRows[0]?.total ?? 0,
  };
}

export async function updateService(id: string, input: UpdateServiceInput) {
  const db = await getDb();
  const [service] = await db
    .update(servicesTable)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(servicesTable.id, id))
    .returning();

  return service ?? null;
}

export async function softDeleteService(id: string) {
  const db = await getDb();
  const [service] = await db
    .update(servicesTable)
    .set({
      deletedAt: new Date(),
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(servicesTable.id, id))
    .returning();

  return service ?? null;
}

export async function restoreService(id: string) {
  const db = await getDb();
  const [service] = await db
    .update(servicesTable)
    .set({
      deletedAt: null,
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(servicesTable.id, id))
    .returning();

  return service ?? null;
}

export async function findActiveServices() {
  const db = await getDb();

  return db
    .select()
    .from(servicesTable)
    .where(and(eq(servicesTable.isActive, true), isNull(servicesTable.deletedAt)))
    .orderBy(desc(servicesTable.createdAt))
    .limit(20);
}

export async function countActiveMembershipsForService(serviceId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ total: count() })
    .from(membershipsTable)
    .innerJoin(plansTable, eq(membershipsTable.planId, plansTable.id))
    .where(and(eq(plansTable.serviceId, serviceId), eq(membershipsTable.status, 'active')));

  return row?.total ?? 0;
}

async function getDb() {
  const { db } = await import('@/server/lib/db/client');
  return db;
}

interface FindServicesInput {
  page: number;
  pageSize: number;
}

type InsertServiceInput = typeof servicesTable.$inferInsert;

type UpdateServiceInput = Partial<
  Pick<
    InsertServiceInput,
    'category' | 'descriptionContent' | 'imageKey' | 'isActive' | 'name' | 'supportsProfiles'
  >
>;
