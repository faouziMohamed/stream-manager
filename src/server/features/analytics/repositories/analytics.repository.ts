import { and, count, eq, gte, lt, lte, sql } from 'drizzle-orm';

import {
  customersTable,
  membershipsTable,
  paymentsTable,
  plansTable,
} from '@/server/lib/db/tables/membership-management.table';

export async function getDashboardStatsSnapshot() {
  const db = await getDb();
  const today = toDateOnly(new Date());
  const monthStartDate = new Date(`${today.slice(0, 7)}-01T00:00:00.000Z`);
  const nextMonthStartDate = new Date(monthStartDate);
  nextMonthStartDate.setUTCMonth(nextMonthStartDate.getUTCMonth() + 1);
  const monthStart = toDateOnly(monthStartDate);
  const nextMonthStart = toDateOnly(nextMonthStartDate);
  const inSevenDays = toDateOnly(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const [activeMemberships, monthRevenue, overduePayments, expiringSoon] = await Promise.all([
    db
      .select({ total: count() })
      .from(membershipsTable)
      .where(eq(membershipsTable.status, 'active')),
    db
      .select({
        total: sql<string>`COALESCE(SUM(${paymentsTable.amount}), '0')`,
      })
      .from(paymentsTable)
      .where(
        and(
          eq(paymentsTable.status, 'paid'),
          gte(paymentsTable.paidDate, monthStart),
          lt(paymentsTable.paidDate, nextMonthStart)
        )
      ),
    db.select({ total: count() }).from(paymentsTable).where(eq(paymentsTable.status, 'overdue')),
    db
      .select({ total: count() })
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.status, 'active'),
          gte(membershipsTable.endDate, today),
          lte(membershipsTable.endDate, inSevenDays)
        )
      ),
  ]);

  return {
    activeMemberships: activeMemberships[0]?.total ?? 0,
    expiringInSevenDays: expiringSoon[0]?.total ?? 0,
    overduePayments: overduePayments[0]?.total ?? 0,
    revenueThisMonth: monthRevenue[0]?.total ?? '0',
  };
}

export async function getRevenueBuckets(months: number) {
  const db = await getDb();
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMonth(start.getUTCMonth() - (months - 1));
  const startDate = toDateOnly(start);
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${paymentsTable.paidDate}::date), 'YYYY-MM')`,
      revenue: sql<string>`COALESCE(SUM(${paymentsTable.amount}), '0')`,
    })
    .from(paymentsTable)
    .where(and(eq(paymentsTable.status, 'paid'), gte(paymentsTable.paidDate, startDate)))
    .groupBy(sql`date_trunc('month', ${paymentsTable.paidDate}::date)`);

  return rows;
}

export async function getMembershipTimelineRows() {
  const db = await getDb();
  return db
    .select({
      customerName: customersTable.name,
      endDate: membershipsTable.endDate,
      id: membershipsTable.id,
      planName: plansTable.name,
      startDate: membershipsTable.startDate,
    })
    .from(membershipsTable)
    .innerJoin(customersTable, eq(membershipsTable.customerId, customersTable.id))
    .innerJoin(plansTable, eq(membershipsTable.planId, plansTable.id))
    .where(eq(membershipsTable.status, 'active'));
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function getDb() {
  const { db } = await import('@/server/lib/db/client');
  return db;
}
