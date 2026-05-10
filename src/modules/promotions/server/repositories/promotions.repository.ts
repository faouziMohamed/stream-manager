import { db } from '@/lib/db';
import {
  promotions,
  promotionServices,
  services,
} from '@/lib/db/tables/subscription-management.table';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createLogger } from '@/lib/logger';

const logger = createLogger('promotions-repository');

export type CreatePromotionInput = {
  name: string;
  description?: string | null;
  serviceIds: string[];
  startsAt?: string | null;
  expiresAt?: string | null;
  showOnHomepage?: boolean;
};

export type UpdatePromotionInput = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  showOnHomepage?: boolean;
  serviceIds?: string[];
  startsAt?: string | null;
  expiresAt?: string | null;
};

export async function getAllPromotions() {
  return db.select().from(promotions).orderBy(promotions.name);
}

export async function getPublicPromotions() {
  const now = new Date();
  const all = await db
    .select()
    .from(promotions)
    .where(and(eq(promotions.isActive, true), eq(promotions.showOnHomepage, true)))
    .orderBy(promotions.name);
  return all.filter((p) => !p.expiresAt || new Date(p.expiresAt) > now);
}

export async function getPromotionById(id: string) {
  const [promo] = await db.select().from(promotions).where(eq(promotions.id, id));
  return promo ?? null;
}

export async function getPromotionServices(promotionId: string) {
  const rows = await db
    .select({ serviceId: promotionServices.serviceId })
    .from(promotionServices)
    .where(eq(promotionServices.promotionId, promotionId));
  return rows.map((r) => r.serviceId);
}

export async function getServicesForPromotion(promotionId: string) {
  const rows = await db
    .select({ service: services })
    .from(promotionServices)
    .innerJoin(services, eq(promotionServices.serviceId, services.id))
    .where(eq(promotionServices.promotionId, promotionId));
  return rows.map((r) => r.service);
}

export async function createPromotion(input: CreatePromotionInput) {
  const id = nanoid();
  const [promo] = await db
    .insert(promotions)
    .values({
      id,
      name: input.name,
      description: input.description ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning();

  if (input.serviceIds.length > 0) {
    await db.insert(promotionServices).values(
      input.serviceIds.map((serviceId) => ({
        id: nanoid(),
        promotionId: id,
        serviceId,
      }))
    );
  }
  logger.info({ id }, 'Created promotion');
  return promo;
}

export async function updatePromotion(id: string, input: UpdatePromotionInput) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.startsAt !== undefined)
    updateData.startsAt = input.startsAt ? new Date(input.startsAt) : null;
  if (input.expiresAt !== undefined)
    updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

  const [promo] = await db
    .update(promotions)
    .set(updateData)
    .where(eq(promotions.id, id))
    .returning();

  if (input.serviceIds !== undefined) {
    await db.delete(promotionServices).where(eq(promotionServices.promotionId, id));
    if (input.serviceIds.length > 0) {
      await db.insert(promotionServices).values(
        input.serviceIds.map((serviceId) => ({
          id: nanoid(),
          promotionId: id,
          serviceId,
        }))
      );
    }
  }
  return promo ?? null;
}

export async function deletePromotion(id: string) {
  await db.delete(promotions).where(eq(promotions.id, id));
  return true;
}
