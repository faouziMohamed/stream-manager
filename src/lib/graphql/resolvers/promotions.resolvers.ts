import { requireAdmin, requireAuth } from './guards';
import {
  getAllPromotions,
  getPromotionById,
  getServicesForPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPlansByPromotion,
} from '@/lib/db/repositories/services.repository';
import type { GraphQLContext } from '../context';

export const promotionsResolvers = {
  Query: {
    promotions: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return getAllPromotions();
    },
    promotion: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return getPromotionById(id);
    },
  },
  Mutation: {
    createPromotion: async (
      _: unknown,
      { input }: { input: { name: string; description?: string; serviceIds: string[] } },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return createPromotion(input);
    },
    updatePromotion: async (
      _: unknown,
      { id, input }: { id: string; input: { name?: string; description?: string; isActive?: boolean; serviceIds?: string[] } },
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
  },
};
