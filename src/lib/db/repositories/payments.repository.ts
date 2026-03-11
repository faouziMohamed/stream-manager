import { db } from "@/lib/db";
import { payments } from "@/lib/db/tables/subscription-management.table";
import { and, eq, gte, lt, lte, sql } from "drizzle-orm";
import { createLogger } from "@/lib/logger";

const logger = createLogger("payments-repository");

export type UpdatePaymentInput = {
  status?: "paid" | "unpaid" | "overdue";
  paidDate?: string | null;
  notes?: string | null;
};

export async function getAllPayments(filters?: {
  subscriptionId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}) {
  let query = db.select().from(payments).$dynamic();

  if (filters?.subscriptionId) {
    query = query.where(eq(payments.subscriptionId, filters.subscriptionId));
  }
  if (filters?.status) {
    query = query.where(
      eq(payments.status, filters.status as "paid" | "unpaid" | "overdue"),
    );
  }
  if (filters?.fromDate) {
    query = query.where(gte(payments.dueDate, filters.fromDate));
  }
  if (filters?.toDate) {
    query = query.where(lte(payments.dueDate, filters.toDate));
  }

  return query.orderBy(payments.dueDate);
}

export async function getPaymentById(id: string) {
  const [payment] = await db.select().from(payments).where(eq(payments.id, id));
  return payment ?? null;
}

export async function getPaymentsBySubscription(subscriptionId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.subscriptionId, subscriptionId))
    .orderBy(payments.dueDate);
}

export async function updatePayment(id: string, input: UpdatePaymentInput) {
  const [payment] = await db
    .update(payments)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(payments.id, id))
    .returning();
  return payment ?? null;
}

export async function markPaymentPaid(id: string, paidDate?: string) {
  const today = new Date().toISOString().slice(0, 10);
  const [payment] = await db
    .update(payments)
    .set({
      status: "paid",
      paidDate: paidDate ?? today,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, id))
    .returning();
  logger.info({ id }, "Marked payment as paid");
  return payment ?? null;
}

/**
 * Mark all unpaid payments whose dueDate is in the past as 'overdue'.
 * Called by analytics / dashboard to keep status fresh.
 */
export async function syncOverduePayments() {
  const today = new Date().toISOString().slice(0, 10);
  await db
    .update(payments)
    .set({ status: "overdue", updatedAt: new Date() })
    .where(
      and(
        eq(payments.status, "unpaid"),
        lt(payments.dueDate, sql`${today}::date`),
      ),
    );
}
