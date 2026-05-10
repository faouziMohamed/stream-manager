import { db } from '@/lib/db';
import { plans } from '@/lib/db/tables/subscription-management.table';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createLogger } from '@/lib/logger';

const logger = createLogger('plans-repository');

export type CreatePlanInput = {
  name: string;
  durationMonths: number;
  price: string;
  currencyCode: string;
  planType: 'full' | 'partial' | 'custom' | 'bundle';
  description?: string | null;
  serviceId?: string | null;
  promotionId?: string | null;
};

export type UpdatePlanInput = Partial<CreatePlanInput & { isActive: boolean }>;

export async function getPlansByService(serviceId: string) {
  return db
    .select()
    .from(plans)
    .where(eq(plans.serviceId, serviceId))
    .orderBy(plans.durationMonths);
}

export async function getPlansByPromotion(promotionId: string) {
  return db
    .select()
    .from(plans)
    .where(eq(plans.promotionId, promotionId))
    .orderBy(plans.durationMonths);
}

export async function getAllPlans(serviceId?: string, promotionId?: string) {
  if (serviceId) return getPlansByService(serviceId);
  if (promotionId) return getPlansByPromotion(promotionId);
  return db.select().from(plans).orderBy(plans.durationMonths);
}

export async function getPlanById(id: string) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, id));
  return plan ?? null;
}

export async function createPlan(input: CreatePlanInput) {
  const id = nanoid();
  const [plan] = await db
    .insert(plans)
    .values({ id, ...input })
    .returning();
  logger.info({ id }, 'Created plan');
  return plan;
}

export async function updatePlan(id: string, input: UpdatePlanInput) {
  const [plan] = await db
    .update(plans)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(plans.id, id))
    .returning();
  return plan ?? null;
}

export async function deletePlan(id: string) {
  await db.delete(plans).where(eq(plans.id, id));
  return true;
}
