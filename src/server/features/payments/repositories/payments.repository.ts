import { and, asc, count, desc, eq, gte, inArray, like, lte, lt } from 'drizzle-orm';

import { customersTable, paymentsTable } from '@/server/lib/db/tables/membership-management.table';

export async function insertPayment(input: InsertPaymentInput) {
  const db = await getDb();
  const [payment] = await db.insert(paymentsTable).values(input).returning();

  return payment ?? null;
}

export async function findPaymentById(id: string) {
  const db = await getDb();
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, id)).limit(1);

  return payment ?? null;
}

export async function findPaymentsByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const db = await getDb();
  return db
    .select()
    .from(paymentsTable)
    .where(inArray(paymentsTable.id, ids))
    .orderBy(asc(paymentsTable.dueDate));
}

export async function findPayments(input: FindPaymentsInput) {
  const db = await getDb();
  const offset = (input.page - 1) * input.pageSize;
  const filters = [
    input.customerId === undefined ? undefined : eq(paymentsTable.customerId, input.customerId),
    input.dueFrom === undefined ? undefined : gte(paymentsTable.dueDate, input.dueFrom),
    input.dueTo === undefined ? undefined : lte(paymentsTable.dueDate, input.dueTo),
    input.membershipId === undefined
      ? undefined
      : eq(paymentsTable.membershipId, input.membershipId),
    input.status === undefined ? undefined : eq(paymentsTable.status, input.status),
  ].filter((filter) => filter !== undefined);
  const where = filters.length === 0 ? undefined : and(...filters);

  const [items, totalRows] = await Promise.all([
    db
      .select()
      .from(paymentsTable)
      .where(where)
      // The id breaks ties: without it, rows due on the same day can swap
      // order between two OFFSET queries, so a page repeats or skips entries.
      .orderBy(
        input.order === 'asc' ? asc(paymentsTable.dueDate) : desc(paymentsTable.dueDate),
        input.order === 'asc' ? asc(paymentsTable.id) : desc(paymentsTable.id)
      )
      .limit(input.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(paymentsTable).where(where),
  ]);

  return {
    items,
    total: totalRows[0]?.total ?? 0,
  };
}

export async function updatePaymentPaid(id: string, paidDate: string) {
  return updatePayment(id, {
    paidDate,
    status: 'paid',
  });
}

export async function findUnpaidPaymentsBefore(cutoffDate: string) {
  const db = await getDb();

  return db
    .select()
    .from(paymentsTable)
    .where(and(eq(paymentsTable.status, 'unpaid'), lt(paymentsTable.dueDate, cutoffDate)));
}

export async function markOverduePaymentsBefore(cutoffDate: string) {
  const db = await getDb();

  return db
    .update(paymentsTable)
    .set({
      status: 'overdue',
      updatedAt: new Date(),
    })
    .where(and(eq(paymentsTable.status, 'unpaid'), lt(paymentsTable.dueDate, cutoffDate)))
    .returning();
}

export async function markPaymentsOverdue(ids: string[]) {
  if (ids.length === 0) {
    return 0;
  }

  const db = await getDb();
  const updates = await Promise.all(
    ids.map((id) =>
      db
        .update(paymentsTable)
        .set({
          status: 'overdue',
          updatedAt: new Date(),
        })
        .where(eq(paymentsTable.id, id))
        .returning({ id: paymentsTable.id })
    )
  );

  return updates.reduce((total, rows) => total + rows.length, 0);
}

export async function findAllPaymentsForSummary() {
  const db = await getDb();

  return db
    .select({
      amount: paymentsTable.amount,
      businessId: paymentsTable.businessId,
      currencyCode: paymentsTable.currencyCode,
      customerName: customersTable.name,
      dueDate: paymentsTable.dueDate,
      id: paymentsTable.id,
      method: paymentsTable.method,
      paidDate: paymentsTable.paidDate,
      status: paymentsTable.status,
    })
    .from(paymentsTable)
    .innerJoin(customersTable, eq(paymentsTable.customerId, customersTable.id))
    .orderBy(desc(paymentsTable.dueDate));
}

export async function findLatestPaymentBusinessId(year: number) {
  const db = await getDb();
  const prefix = `PAY-${year}-`;
  const [payment] = await db
    .select({ businessId: paymentsTable.businessId })
    .from(paymentsTable)
    .where(like(paymentsTable.businessId, `${prefix}%`))
    .orderBy(desc(paymentsTable.businessId))
    .limit(1);

  return payment?.businessId ?? null;
}

async function updatePayment(id: string, input: PaymentUpdateInput) {
  const db = await getDb();
  const [payment] = await db
    .update(paymentsTable)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(paymentsTable.id, id))
    .returning();

  return payment ?? null;
}

async function getDb() {
  const { db } = await import('@/server/lib/db/client');
  return db;
}

type PaymentUpdateInput = Partial<Pick<typeof paymentsTable.$inferInsert, 'paidDate' | 'status'>>;
type InsertPaymentInput = typeof paymentsTable.$inferInsert;

interface FindPaymentsInput {
  customerId?: string;
  dueFrom?: string;
  dueTo?: string;
  membershipId?: string;
  order?: 'asc' | 'desc';
  page: number;
  pageSize: number;
  status?: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
}
