import { requireAdmin, requireAuth } from "./guards";
import {
  createPromotion,
  createService,
  deletePromotion,
  getAllPromotions,
  getPlansByPromotion,
  getPromotionById,
  getServicesForPromotion,
  updatePromotion,
} from "@/lib/db/repositories/services.repository";
import type { GraphQLContext } from "../context";

export const promotionsResolvers = {
  Query: {
    promotions: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return getAllPromotions();
    },
    promotion: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return getPromotionById(id);
    },
  },
  Mutation: {
    createPromotion: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          name: string;
          description?: string;
          serviceIds: string[];
          newServiceName?: string;
          newServiceCategory?: string;
          startsAt?: string;
          expiresAt?: string;
          showOnHomepage?: boolean;
        };
      },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const serviceIds = [...input.serviceIds];
      if (input.newServiceName?.trim()) {
        const newSvc = await createService({
          name: input.newServiceName.trim(),
          category: input.newServiceCategory ?? "streaming",
        });
        serviceIds.push(newSvc.id);
      }
      return createPromotion({
        name: input.name,
        description: input.description,
        serviceIds,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        showOnHomepage: input.showOnHomepage,
      });
    },
    updatePromotion: async (
      _: unknown,
      {
        id,
        input,
      }: {
        id: string;
        input: {
          name?: string;
          description?: string;
          isActive?: boolean;
          showOnHomepage?: boolean;
          serviceIds?: string[];
          startsAt?: string;
          expiresAt?: string;
        };
      },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const promo = await updatePromotion(id, input);
      if (!promo) throw new Error(`Promotion ${id} not found`);
      return promo;
    },
    deletePromotion: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return deletePromotion(id);
    },
  },
  Promotion: {
    services: (parent: { id: string }) => getServicesForPromotion(parent.id),
    plans: (parent: { id: string }) => getPlansByPromotion(parent.id),
    isExpired: (parent: { expiresAt?: Date | null }) => {
      if (!parent.expiresAt) return false;
      return new Date(parent.expiresAt) < new Date();
    },
  },
};
