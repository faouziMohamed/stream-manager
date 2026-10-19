import { and, count, desc, eq, gt, inArray, like } from 'drizzle-orm';

import {
  customersTable,
  membershipsTable,
  paymentsTable,
  plansTable,
} from '@/server/lib/db/tables/membership-management.table';
import { streamingProfileAssignmentsTable } from '@/server/lib/db/tables/streaming-accounts.table';
import type { MembershipStatus } from '@/server/features/memberships/schemas/model/memberships.model';

/**
 * Several consecutive terms, each with its payment, in one transaction: a
 * renewal paid months ahead either lands whole or not at all.
 */
export async function insertMembershipTerms(terms: InsertMembershipWithPaymentInput[]) {
  const db = await getDb();

  return db.transaction(async (tx) => {
    const created: (typeof membershipsTable.$inferSelect & {
      payment: typeof paymentsTable.$inferSelect;
    })[] = [];

    for (const term of terms) {
      const [membership] = await tx.insert(membershipsTable).values(term.membership).returning();

      if (membership === undefined) {
        return null;
      }

      const [payment] = await tx
        .insert(paymentsTable)
        .values({ ...term.payment, membershipId: membership.id })
        .returning();

      if (payment === undefined) {
        return null;
      }

      created.push({ ...membership, payment });
    }

    // A profile assignment outlives the term it was made on. Moving it to the
    // newest term keeps "who holds a profile" true after a renewal instead of
    // reporting the holder as expired because their slot predates the renewal.
    const previousTermId = terms[0]?.membership.renewedFromId;
    const newestTerm = created.at(-1);

    if (previousTermId !== null && previousTermId !== undefined && newestTerm !== undefined) {
      await tx
        .update(streamingProfileAssignmentsTable)
        .set({ membershipId: newestTerm.id })
        .where(eq(streamingProfileAssignmentsTable.membershipId, previousTermId));
    }

    return created;
  });
}

export async function insertMembershipWithPayment(input: InsertMembershipWithPaymentInput) {
  const db = await getDb();

  return db.transaction(async (tx) => {
    const [membership] = await tx.insert(membershipsTable).values(input.membership).returning();

    if (membership === undefined) {
      return null;
    }

    const [payment] = await tx
      .insert(paymentsTable)
      .values({
        ...input.payment,
        membershipId: membership.id,
      })
      .returning();

    if (payment === undefined) {
      return null;
    }

    return {
      ...membership,
      payment,
    };
  });
}

export async function findMembershipById(id: string) {
  const db = await getDb();
  const [membership] = await db
    .select()
    .from(membershipsTable)
    .where(eq(membershipsTable.id, id))
    .limit(1);

  return membership ?? null;
}

/** The term that replaced this one, if any — a chain has at most one. */
export async function findMembershipsByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const db = await getDb();
  return db.select().from(membershipsTable).where(inArray(membershipsTable.id, ids));
}

export async function findMembershipRenewedFrom(renewedFromId: string) {
  const db = await getDb();
  const [membership] = await db
    .select({ businessId: membershipsTable.businessId, id: membershipsTable.id })
    .from(membershipsTable)
    .where(eq(membershipsTable.renewedFromId, renewedFromId))
    .limit(1);

  return membership ?? null;
}

export async function findMemberships(input: FindMembershipsInput) {
  const db = await getDb();
  const offset = (input.page - 1) * input.pageSize;
  const filters = [
    input.customerId === undefined ? undefined : eq(membershipsTable.customerId, input.customerId),
    input.planId === undefined ? undefined : eq(membershipsTable.planId, input.planId),
    input.status === undefined ? undefined : eq(membershipsTable.status, input.status),
    input.serviceId === undefined ? undefined : eq(plansTable.serviceId, input.serviceId),
  ].filter((filter): filter is NonNullable<typeof filter> => filter !== undefined);
  const whereClause = filters.length === 0 ? undefined : and(...filters);

  if (input.serviceId !== undefined) {
    const [items, totalRows] = await Promise.all([
      db
        .select({
          businessId: membershipsTable.businessId,
          createdAt: membershipsTable.createdAt,
          customerId: membershipsTable.customerId,
          endDate: membershipsTable.endDate,
          id: membershipsTable.id,
          isRecurring: membershipsTable.isRecurring,
          planId: membershipsTable.planId,
          renewedFromId: membershipsTable.renewedFromId,
          startDate: membershipsTable.startDate,
          status: membershipsTable.status,
          updatedAt: membershipsTable.updatedAt,
        })
        .from(membershipsTable)
        .innerJoin(plansTable, eq(membershipsTable.planId, plansTable.id))
        .where(whereClause)
        .orderBy(desc(membershipsTable.createdAt))
        .limit(input.pageSize)
        .offset(offset),
      db
        .select({ total: count() })
        .from(membershipsTable)
        .innerJoin(plansTable, eq(membershipsTable.planId, plansTable.id))
        .where(whereClause),
    ]);

    return {
      items,
      total: totalRows[0]?.total ?? 0,
    };
  }

  const [items, totalRows] = await Promise.all([
    db
      .select()
      .from(membershipsTable)
      .where(whereClause)
      .orderBy(desc(membershipsTable.createdAt))
      .limit(input.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(membershipsTable).where(whereClause),
  ]);

  return {
    items,
    total: totalRows[0]?.total ?? 0,
  };
}

export async function cancelMembershipWithPendingPayments(id: string, today: string) {
  const db = await getDb();

  return db.transaction(async (tx) => {
    const [membership] = await tx
      .update(membershipsTable)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(membershipsTable.id, id))
      .returning();

    if (membership === undefined) {
      return null;
    }

    // Cancellation ends cover that has not started yet; it does not forgive
    // money already due. Only future charges are cancelled — an unpaid or
    // overdue payment whose due date has arrived stays in the ledger so the
    // debt can still be collected after the subscription is closed.
    await tx
      .update(paymentsTable)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(paymentsTable.membershipId, id),
          inArray(paymentsTable.status, ['unpaid', 'overdue']),
          gt(paymentsTable.dueDate, today)
        )
      );

    return membership;
  });
}

export async function findLatestMembershipBusinessId(year: number) {
  const db = await getDb();
  const prefix = `MBR-${year}-`;
  const [membership] = await db
    .select({ businessId: membershipsTable.businessId })
    .from(membershipsTable)
    .where(like(membershipsTable.businessId, `${prefix}%`))
    .orderBy(desc(membershipsTable.businessId))
    .limit(1);

  return membership?.businessId ?? null;
}

export async function countActiveMembershipsByPlanId(planId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ total: count() })
    .from(membershipsTable)
    .where(and(eq(membershipsTable.planId, planId), eq(membershipsTable.status, 'active')));

  return row?.total ?? 0;
}

export async function findActiveMembershipsEndingOn(endDate: string) {
  const db = await getDb();

  return db
    .select()
    .from(membershipsTable)
    .where(and(eq(membershipsTable.status, 'active'), eq(membershipsTable.endDate, endDate)));
}

export async function findAllMembershipsForSummary() {
  const db = await getDb();

  return db
    .select({
      businessId: membershipsTable.businessId,
      customerName: customersTable.name,
      endDate: membershipsTable.endDate,
      id: membershipsTable.id,
      isRecurring: membershipsTable.isRecurring,
      planName: plansTable.name,
      startDate: membershipsTable.startDate,
      status: membershipsTable.status,
    })
    .from(membershipsTable)
    .innerJoin(customersTable, eq(membershipsTable.customerId, customersTable.id))
    .innerJoin(plansTable, eq(membershipsTable.planId, plansTable.id))
    .orderBy(desc(membershipsTable.createdAt));
}

export async function expireActiveMembershipsEndingOn(endDate: string) {
  const db = await getDb();

  return db
    .update(membershipsTable)
    .set({
      status: 'expired',
      updatedAt: new Date(),
    })
    .where(and(eq(membershipsTable.status, 'active'), eq(membershipsTable.endDate, endDate)))
    .returning();
}

async function getDb() {
  const { db } = await import('@/server/lib/db/client');
  return db;
}

type InsertMembershipInput = typeof membershipsTable.$inferInsert;
type InsertPaymentInput = typeof paymentsTable.$inferInsert;

interface FindMembershipsInput {
  customerId?: string;
  page: number;
  pageSize: number;
  planId?: string;
  serviceId?: string;
  status?: MembershipStatus;
}

interface InsertMembershipWithPaymentInput {
  membership: InsertMembershipInput;
  payment: InsertPaymentInput;
}
