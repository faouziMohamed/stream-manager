import { db } from '@/lib/db';
import { plans, services, subscriptions } from '@/lib/db/tables/subscription-management.table';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createLogger } from '@/lib/logger';

const logger = createLogger('services-repository');

export type CreateServiceInput = {
  name: string;
  category: string;
  description?: string | null;
  logoUrl?: string | null;
  showOnHomepage?: boolean;
};

export type UpdateServiceInput = Partial<
  CreateServiceInput & {
    isActive: boolean;
    showOnHomepage: boolean;
    deletedAt: Date | null;
  }
>;

export async function getAllServices() {
  return db.select().from(services).where(isNull(services.deletedAt)).orderBy(services.name);
}

export async function getPublicServices() {
  return db
    .select()
    .from(services)
    .where(
      and(
        eq(services.isActive, true),
        eq(services.showOnHomepage, true),
        isNull(services.deletedAt)
      )
    )
    .orderBy(services.name);
}

export async function getDeletedServices() {
  return db
    .select()
    .from(services)
    .where(isNotNull(services.deletedAt))
    .orderBy(services.deletedAt);
}

export async function getServiceById(id: string) {
  const [service] = await db.select().from(services).where(eq(services.id, id));
  return service ?? null;
}

export async function getServiceWithPlans(id: string) {
  const service = await getServiceById(id);
  if (!service) return null;
  const servicePlans = await db
    .select()
    .from(plans)
    .where(and(eq(plans.serviceId, id), eq(plans.isActive, true)))
    .orderBy(plans.durationMonths);
  return { ...service, plans: servicePlans };
}

export async function createService(input: CreateServiceInput) {
  const id = nanoid();
  const [service] = await db
    .insert(services)
    .values({ id, ...input })
    .returning();
  logger.info({ id }, 'Created service');
  return service;
}

export async function updateService(id: string, input: UpdateServiceInput) {
  const [service] = await db
    .update(services)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(services.id, id))
    .returning();
  return service ?? null;
}

export async function softDeleteService(id: string) {
  await db
    .update(services)
    .set({ deletedAt: new Date(), isActive: false })
    .where(eq(services.id, id));
  logger.info({ id }, 'Soft-deleted service');
  return true;
}

export async function countLinkedSubscriptions(serviceId: string): Promise<number> {
  const servicePlans = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.serviceId, serviceId));
  if (servicePlans.length === 0) return 0;
  const planIds = servicePlans.map((p) => p.id);
  let count = 0;
  for (const planId of planIds) {
    const rows = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.planId, planId));
    count += rows.length;
  }
  return count;
}

export async function hardDeleteService(id: string) {
  const servicePlans = await db.select({ id: plans.id }).from(plans).where(eq(plans.serviceId, id));

  for (const plan of servicePlans) {
    await db.delete(subscriptions).where(eq(subscriptions.planId, plan.id));
  }

  await db.delete(services).where(eq(services.id, id));
  logger.info({ id }, 'Hard-deleted service with all children');
  return true;
}

export async function deleteService(id: string) {
  return softDeleteService(id);
}
