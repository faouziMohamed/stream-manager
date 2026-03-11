import {db} from '@/lib/db';
import {payments, plans, subscriptions,} from '@/lib/db/tables/subscription-management.table';
import {and, eq} from 'drizzle-orm';
import {nanoid} from 'nanoid';
import {createLogger} from '@/lib/logger';
import {computeEndDate, formatDateISO} from '@/lib/utils/date-utils';

const logger = createLogger('subscriptions-repository');

export type CreateSubscriptionInput = {
    clientId: string;
    planId: string;
    startDate: string | Date; // DateResolver (graphql-scalars) passes a Date object
    isRecurring: boolean;
    notes?: string | null;
};

export type UpdateSubscriptionInput = {
    startDate?: string | Date;
    isRecurring?: boolean;
    status?: 'active' | 'expired' | 'paused' | 'cancelled';
    notes?: string | null;
};

export type RenewSubscriptionInput = {
    subscriptionId: string;
    startDate: string | Date; // DateResolver passes a Date object
    isRecurring: boolean;
    notes?: string | null;
};

export async function getAllSubscriptions(
    clientId?: string,
    status?: string,
) {
    let query = db.select().from(subscriptions).$dynamic();
    if (clientId) {
        query = query.where(eq(subscriptions.clientId, clientId));
    }
    if (status) {
        query = query.where(
            eq(subscriptions.status, status as 'active' | 'expired' | 'paused' | 'cancelled'),
        );
    }
    return query.orderBy(subscriptions.startDate);
}

export async function getSubscriptionById(id: string) {
    const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, id));
    return sub ?? null;
}

export async function getSubscriptionsByClient(clientId: string) {
    return db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.clientId, clientId))
        .orderBy(subscriptions.startDate);
}

export async function countActiveSubscriptionsByClient(clientId: string) {
    const rows = await db
        .select()
        .from(subscriptions)
        .where(
            and(
                eq(subscriptions.clientId, clientId),
                eq(subscriptions.status, 'active'),
            ),
        );
    return rows.length;
}

export async function createSubscription(input: CreateSubscriptionInput) {
    // 1. Fetch the plan to get durationMonths and price
    const [plan] = await db.select().from(plans).where(eq(plans.id, input.planId));
    if (!plan) throw new Error(`Plan ${input.planId} not found`);

    // DateResolver (graphql-scalars) deserializes Date scalars into JS Date objects.
    // Normalise to a plain YYYY-MM-DD string regardless of what arrives.
    const startDateStr =
        input.startDate instanceof Date
            ? formatDateISO(input.startDate)
            : formatDateISO(new Date(`${String(input.startDate)}T00:00:00.000Z`));

    const startDate = new Date(`${startDateStr}T00:00:00.000Z`);
    const endDate = computeEndDate(startDate, plan.durationMonths);
    const endDateStr = formatDateISO(endDate);

    // 2. Create subscription
    const subId = nanoid();
    const [sub] = await db
        .insert(subscriptions)
        .values({
            id: subId,
            clientId: input.clientId,
            planId: input.planId,
            startDate: startDateStr,
            endDate: endDateStr,
            isRecurring: input.isRecurring,
            notes: input.notes ?? null,
            status: 'active',
        })
        .returning();

    // 3. Auto-create payment
    const paymentId = nanoid();
    await db.insert(payments).values({
        id: paymentId,
        subscriptionId: subId,
        dueDate: startDateStr,
        amount: plan.price,
        currencyCode: plan.currencyCode,
        status: 'unpaid',
    });

    logger.info({subId, paymentId}, 'Created subscription + payment');
    return sub;
}

export async function updateSubscription(id: string, input: UpdateSubscriptionInput) {
    const updateData: Record<string, unknown> = {updatedAt: new Date()};
    if (input.status !== undefined) updateData.status = input.status;
    if (input.isRecurring !== undefined) updateData.isRecurring = input.isRecurring;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.startDate !== undefined) {
        updateData.startDate =
            input.startDate instanceof Date
                ? formatDateISO(input.startDate)
                : formatDateISO(new Date(`${String(input.startDate)}T00:00:00.000Z`));
    }

    const [sub] = await db
        .update(subscriptions)
        .set(updateData)
        .where(eq(subscriptions.id, id))
        .returning();
    return sub ?? null;
}

export async function deleteSubscription(id: string) {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
    return true;
}

export async function renewSubscription(input: RenewSubscriptionInput) {
    // 1. Get old subscription + plan
    const [oldSub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, input.subscriptionId));
    if (!oldSub) throw new Error(`Subscription ${input.subscriptionId} not found`);

    const [plan] = await db.select().from(plans).where(eq(plans.id, oldSub.planId));
    if (!plan) throw new Error(`Plan ${oldSub.planId} not found`);

    // 2. Mark old subscription as expired
    await db
        .update(subscriptions)
        .set({status: 'expired', updatedAt: new Date()})
        .where(eq(subscriptions.id, input.subscriptionId));

    // 3. Create new subscription — normalise startDate (DateResolver passes a Date object)
    const startDateStr =
        input.startDate instanceof Date
            ? formatDateISO(input.startDate)
            : formatDateISO(new Date(`${String(input.startDate)}T00:00:00.000Z`));

    const startDate = new Date(`${startDateStr}T00:00:00.000Z`);
    const endDate = computeEndDate(startDate, plan.durationMonths);
    const endDateStr = formatDateISO(endDate);

    const newSubId = nanoid();
    const [newSub] = await db
        .insert(subscriptions)
        .values({
            id: newSubId,
            clientId: oldSub.clientId,
            planId: oldSub.planId,
            startDate: startDateStr,
            endDate: endDateStr,
            isRecurring: input.isRecurring,
            notes: input.notes ?? null,
            status: 'active',
            renewedFromId: input.subscriptionId,
        })
        .returning();

    // 4. Auto-create payment for renewal
    await db.insert(payments).values({
        id: nanoid(),
        subscriptionId: newSubId,
        dueDate: startDateStr,
        amount: plan.price,
        currencyCode: plan.currencyCode,
        status: 'unpaid',
    });

    logger.info({newSubId, oldSubId: input.subscriptionId}, 'Renewed subscription');
    return newSub;
}
