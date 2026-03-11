import { db } from "@/lib/db";
import {
  subscriptions,
  plans,
  clients,
  services,
  promotions,
} from "@/lib/db/tables/subscription-management.table";
import { eq, and, gte, lte, or } from "drizzle-orm";

export interface TimelineSubscription {
  id: string;
  clientName: string;
  planName: string;
  serviceName: string;
  startDate: string;
  endDate: string;
  status: string;
  isRecurring: boolean;
  price: number;
  currencyCode: string;
  durationMonths: number;
}

/**
 * Returns all subscriptions whose period overlaps with [fromDate, toDate].
 */
export async function getTimelineSubscriptions(
  fromDate: string,
  toDate: string,
): Promise<TimelineSubscription[]> {
  // Overlap: sub.startDate <= toDate AND sub.endDate >= fromDate
  const rows = await db
    .select({
      id: subscriptions.id,
      clientId: subscriptions.clientId,
      planId: subscriptions.planId,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      status: subscriptions.status,
      isRecurring: subscriptions.isRecurring,
      planName: plans.name,
      durationMonths: plans.durationMonths,
      price: plans.price,
      currencyCode: plans.currencyCode,
      serviceId: plans.serviceId,
      promotionId: plans.promotionId,
      clientName: clients.name,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .innerJoin(clients, eq(subscriptions.clientId, clients.id))
    .where(
      and(
        lte(subscriptions.startDate, toDate),
        gte(subscriptions.endDate, fromDate),
      ),
    )
    .orderBy(subscriptions.startDate);

  // Resolve service/promotion name per row
  const result: TimelineSubscription[] = [];
  for (const row of rows) {
    let serviceName = "—";
    if (row.serviceId) {
      const [svc] = await db
        .select({ name: services.name })
        .from(services)
        .where(eq(services.id, row.serviceId));
      serviceName = svc?.name ?? "—";
    } else if (row.promotionId) {
      const [promo] = await db
        .select({ name: promotions.name })
        .from(promotions)
        .where(eq(promotions.id, row.promotionId));
      serviceName = promo ? `[Promo] ${promo.name}` : "—";
    }

    result.push({
      id: row.id,
      clientName: row.clientName,
      planName: row.planName,
      serviceName,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      isRecurring: row.isRecurring,
      price: parseFloat(row.price),
      currencyCode: row.currencyCode,
      durationMonths: row.durationMonths,
    });
  }

  return result;
}
