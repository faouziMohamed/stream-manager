import {db} from '@/lib/db';
import {
  appSettings,
  clients,
  payments,
  plans,
  promotions,
  services,
  subscriptions,
} from '@/lib/db/tables/subscription-management.table';
import {and, count, eq, gte, lt, lte} from 'drizzle-orm';
import { syncOverduePayments } from './payments.repository';

export async function getDefaultCurrency(): Promise<string> {
    const [setting] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, 'defaultCurrency'));
    return setting?.value ?? 'MAD';
}

export async function getDashboardStats() {
    // Sync overdue statuses before computing stats
    await syncOverduePayments();

    const today = new Date().toISOString().slice(0, 10);
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    const currencyCode = await getDefaultCurrency();

    // Active subscriptions count
    const [activeRow] = await db
        .select({count: count()})
        .from(subscriptions)
        .where(eq(subscriptions.status, 'active'));

    // Total clients count
    const [clientsRow] = await db
        .select({count: count()})
        .from(clients)
        .where(eq(clients.isActive, true));

    // MRR: sum of plan prices for active subscriptions (normalised to monthly)
    // We use plan.price / plan.durationMonths * 1 month
    const activeSubsWithPlans = await db
        .select({price: plans.price, durationMonths: plans.durationMonths})
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(eq(subscriptions.status, 'active'));

    const mrr = activeSubsWithPlans.reduce((sum, row) => {
        const monthly = parseFloat(row.price) / row.durationMonths;
        return sum + monthly;
    }, 0);

    // Overdue payments count
    const [overdueRow] = await db
        .select({count: count()})
        .from(payments)
        .where(eq(payments.status, 'overdue'));

    // Upcoming due: unpaid payments due in next 7 days
    const [upcomingRow] = await db
        .select({count: count()})
        .from(payments)
        .where(
            and(
                eq(payments.status, 'unpaid'),
                gte(payments.dueDate, today),
                lte(payments.dueDate, in7Days),
            ),
        );

    return {
        activeSubscriptions: activeRow?.count ?? 0,
        totalClients: clientsRow?.count ?? 0,
        mrr: Math.round(mrr * 100) / 100,
        overdueCount: overdueRow?.count ?? 0,
        upcomingDueCount: upcomingRow?.count ?? 0,
        currencyCode,
    };
}

export async function getMonthlyRevenue(months: number = 12) {
    const currencyCode = await getDefaultCurrency();

    // Generate last N months
    const result: Array<{ month: string; revenue: number; currencyCode: string }> = [];

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const monthStart = `${year}-${month}-01`;
        const nextMonth = new Date(year, d.getMonth() + 1, 1);
        const monthEnd = nextMonth.toISOString().slice(0, 10);

        const rows = await db
            .select({amount: payments.amount})
            .from(payments)
            .where(
                and(
                    eq(payments.status, 'paid'),
                    gte(payments.paidDate, monthStart),
                    lt(payments.paidDate, monthEnd),
                ),
            );

        const revenue = rows.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        result.push({
            month: `${year}-${month}`,
            revenue: Math.round(revenue * 100) / 100,
            currencyCode,
        });
    }

    return result;
}

export async function getPaymentBreakdown(months: number = 6) {
    const currencyCode = await getDefaultCurrency();
    const result: Array<{
        month: string;
        paid: number;
        unpaid: number;
        overdue: number;
        currencyCode: string;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const monthStart = `${year}-${month}-01`;
        const nextMonth = new Date(year, d.getMonth() + 1, 1);
        const monthEnd = nextMonth.toISOString().slice(0, 10);

        const rows = await db
            .select({amount: payments.amount, status: payments.status})
            .from(payments)
            .where(
                and(
                    gte(payments.dueDate, monthStart),
                    lt(payments.dueDate, monthEnd),
                ),
            );

        let paid = 0, unpaid = 0, overdue = 0;
        for (const r of rows) {
            const amt = parseFloat(r.amount);
            if (r.status === 'paid') paid += amt;
            else if (r.status === 'overdue') overdue += amt;
            else unpaid += amt;
        }

        result.push({
            month: `${year}-${month}`,
            paid: Math.round(paid * 100) / 100,
            unpaid: Math.round(unpaid * 100) / 100,
            overdue: Math.round(overdue * 100) / 100,
            currencyCode,
        });
    }

    return result;
}

export async function getSubscriptionsByService() {
    const currencyCode = await getDefaultCurrency();

    // Get active subscriptions grouped by service name
    const rows = await db
        .select({
            serviceName: services.name,
            planPrice: plans.price,
        })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .innerJoin(services, eq(plans.serviceId, services.id))
        .where(eq(subscriptions.status, 'active'));

    // Also bundle subscriptions via promotions
    const promoRows = await db
        .select({
            serviceName: promotions.name,
            planPrice: plans.price,
        })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .innerJoin(promotions, eq(plans.promotionId, promotions.id))
        .where(eq(subscriptions.status, 'active'));

    const allRows = [
        ...rows,
        ...promoRows.map((r) => ({serviceName: `[Bundle] ${r.serviceName}`, planPrice: r.planPrice})),
    ];

    const map = new Map<string, { count: number; revenue: number }>();
    for (const r of allRows) {
        const key = r.serviceName;
        const existing = map.get(key) ?? {count: 0, revenue: 0};
        map.set(key, {
            count: existing.count + 1,
            revenue: existing.revenue + parseFloat(r.planPrice),
        });
    }

    return Array.from(map.entries()).map(([serviceName, data]) => ({
        serviceName,
        count: data.count,
        revenue: Math.round(data.revenue * 100) / 100,
        currencyCode,
    }));
}
