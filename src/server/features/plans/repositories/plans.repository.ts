import { and, count, desc, eq, inArray } from 'drizzle-orm';

import { membershipsTable, plansTable } from '@/server/lib/db/tables/membership-management.table';

export async function insertPlan(input: InsertPlanInput) {
  const db = await getDb();
  const [plan] = await db.insert(plansTable).values(input).returning();

  return plan ?? null;
}

export async function findPlanById(id: string) {
  const db = await getDb();
  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, id)).limit(1);

  return plan ?? null;
}

export async function findPlansByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const db = await getDb();
  return db.select().from(plansTable).where(inArray(plansTable.id, ids));
}

export async function findPlansByServiceId(serviceId: string) {
  const db = await getDb();

  return db.select().from(plansTable).where(eq(plansTable.serviceId, serviceId));
}

export async function findPlans(input: FindPlansInput) {
  const db = await getDb();
  const offset = (input.page - 1) * input.pageSize;
  const filters = [
    input.isActive == null ? undefined : eq(plansTable.isActive, input.isActive),
    input.planType === undefined ? undefined : eq(plansTable.planType, input.planType),
    input.serviceId === undefined ? undefined : eq(plansTable.serviceId, input.serviceId),
  ].filter((filter) => filter !== undefined);
  const where = filters.length === 0 ? undefined : and(...filters);

  const [items, totalRows] = await Promise.all([
    db
      .select()
      .from(plansTable)
      .where(where)
      .orderBy(desc(plansTable.createdAt))
      .limit(input.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(plansTable).where(where),
  ]);

  return {
    items,
    total: totalRows[0]?.total ?? 0,
  };
}

export async function updatePlan(id: string, input: UpdatePlanInput) {
  const db = await getDb();
  const [plan] = await db
    .update(plansTable)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(plansTable.id, id))
    .returning();

  return plan ?? null;
}

export async function deletePlan(id: string) {
  const db = await getDb();
  const [plan] = await db.delete(plansTable).where(eq(plansTable.id, id)).returning();

  return plan ?? null;
}

export async function countActiveMembershipsForPlan(planId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ total: count() })
    .from(membershipsTable)
    .where(and(eq(membershipsTable.planId, planId), eq(membershipsTable.status, 'active')));

  return row?.total ?? 0;
}

// Counts every membership referencing the plan, regardless of status. Any row
// here blocks deletion via the plan_id foreign key (onDelete: restrict).
export async function countMembershipsForPlan(planId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ total: count() })
    .from(membershipsTable)
    .where(eq(membershipsTable.planId, planId));

  return row?.total ?? 0;
}

async function getDb() {
  const { db } = await import('@/server/lib/db/client');
  return db;
}

type InsertPlanInput = typeof plansTable.$inferInsert;
type UpdatePlanInput = Partial<
  Pick<
    InsertPlanInput,
    | 'currencyCode'
    | 'descriptionContent'
    | 'durationMonths'
    | 'isActive'
    | 'name'
    | 'planType'
    | 'price'
    | 'serviceId'
  >
>;

interface FindPlansInput {
  isActive?: boolean;
  page: number;
  pageSize: number;
  planType?: 'individual' | 'shared' | 'family';
  serviceId?: string;
}
