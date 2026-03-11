import { db } from "@/lib/db";
import {
  plans,
  promotions,
  promotionServices,
  services,
} from "@/lib/db/tables/subscription-management.table";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createLogger } from "@/lib/logger";

const logger = createLogger("services-repository");

export type CreateServiceInput = {
  name: string;
  category: string;
  description?: string | null;
  logoUrl?: string | null;
  showOnHomepage?: boolean;
};

export type UpdateServiceInput = Partial<
  CreateServiceInput & { isActive: boolean; showOnHomepage: boolean }
>;

export async function getAllServices() {
  return db.select().from(services).orderBy(services.name);
}

/** Only active services that are flagged to show on the public homepage. */
export async function getPublicServices() {
  return db
    .select()
    .from(services)
    .where(and(eq(services.isActive, true), eq(services.showOnHomepage, true)))
    .orderBy(services.name);
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
  logger.info({ id }, "Created service");
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

export async function deleteService(id: string) {
  await db.delete(services).where(eq(services.id, id));
  logger.info({ id }, "Deleted service");
  return true;
}

// ─── Plans ─────────────────────────────────────────────────────────────────

export type CreatePlanInput = {
  name: string;
  durationMonths: number;
  price: string; // numeric as string for Drizzle
  currencyCode: string;
  planType: "full" | "partial" | "custom" | "bundle";
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
  logger.info({ id }, "Created plan");
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

// ─── Promotions ────────────────────────────────────────────────────────────

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

/** Only active, non-expired promotions flagged to show on the public homepage. */
export async function getPublicPromotions() {
  const now = new Date();
  const all = await db
    .select()
    .from(promotions)
    .where(
      and(eq(promotions.isActive, true), eq(promotions.showOnHomepage, true)),
    )
    .orderBy(promotions.name);
  return all.filter((p) => !p.expiresAt || new Date(p.expiresAt) > now);
}

export async function getPromotionById(id: string) {
  const [promo] = await db
    .select()
    .from(promotions)
    .where(eq(promotions.id, id));
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
      })),
    );
  }
  logger.info({ id }, "Created promotion");
  return promo;
}

export async function updatePromotion(id: string, input: UpdatePromotionInput) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined)
    updateData.description = input.description;
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
    await db
      .delete(promotionServices)
      .where(eq(promotionServices.promotionId, id));
    if (input.serviceIds.length > 0) {
      await db.insert(promotionServices).values(
        input.serviceIds.map((serviceId) => ({
          id: nanoid(),
          promotionId: id,
          serviceId,
        })),
      );
    }
  }
  return promo ?? null;
}

export async function deletePromotion(id: string) {
  await db.delete(promotions).where(eq(promotions.id, id));
  return true;
}
