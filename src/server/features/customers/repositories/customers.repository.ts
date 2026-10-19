import { and, count, desc, eq } from 'drizzle-orm';

import {
  customersTable,
  membershipsTable,
} from '@/server/lib/db/tables/membership-management.table';

export async function insertCustomer(input: InsertCustomerInput) {
  const db = await getDb();
  const [customer] = await db.insert(customersTable).values(input).returning();

  return customer ?? null;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const db = await getDb();
  const [customer] = await db
    .update(customersTable)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(customersTable.id, id))
    .returning();

  return customer ?? null;
}

export async function findCustomerById(id: string) {
  const db = await getDb();
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, id))
    .limit(1);

  return customer ?? null;
}

export async function findCustomers(input: FindCustomersInput) {
  const db = await getDb();
  const offset = (input.page - 1) * input.pageSize;

  const [items, totalRows] = await Promise.all([
    db
      .select()
      .from(customersTable)
      .orderBy(desc(customersTable.createdAt))
      .limit(input.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(customersTable),
  ]);

  return {
    items,
    total: totalRows[0]?.total ?? 0,
  };
}

export async function findLatestCustomerBusinessId() {
  const db = await getDb();
  const [customer] = await db
    .select({ businessId: customersTable.businessId })
    .from(customersTable)
    .orderBy(desc(customersTable.businessId))
    .limit(1);

  return customer?.businessId ?? null;
}

export async function countActiveMembershipsForCustomer(customerId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ total: count() })
    .from(membershipsTable)
    .where(and(eq(membershipsTable.customerId, customerId), eq(membershipsTable.status, 'active')));

  return row?.total ?? 0;
}

async function getDb() {
  const { db } = await import('@/server/lib/db/client');
  return db;
}

type InsertCustomerInput = typeof customersTable.$inferInsert;
type UpdateCustomerInput = Partial<
  Pick<InsertCustomerInput, 'email' | 'isActive' | 'name' | 'notesContent' | 'phone'>
>;

interface FindCustomersInput {
  page: number;
  pageSize: number;
}
