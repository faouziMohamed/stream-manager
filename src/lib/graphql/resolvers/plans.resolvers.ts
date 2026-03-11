import {requireAdmin, requireAuth} from './guards';
import {
  createPlan,
  deletePlan,
  getAllPlans,
  getPlanById,
  getPromotionById,
  getServiceById,
  updatePlan,
} from '@/lib/db/repositories/services.repository';
import type {GraphQLContext} from '../context';

export const plansResolvers = {
    Query: {
        plans: async (
            _: unknown,
            {serviceId, promotionId}: { serviceId?: string; promotionId?: string },
            ctx: GraphQLContext,
        ) => {
            requireAuth(ctx);
            return getAllPlans(serviceId, promotionId);
        },
        plan: async (_: unknown, {id}: { id: string }, ctx: GraphQLContext) => {
            requireAuth(ctx);
            return getPlanById(id);
        },
    },
    Mutation: {
        createPlan: async (
            _: unknown,
            {input}: {
                input: {
                    name: string;
                    durationMonths: number;
                    price: number;
                    currencyCode: string;
                    planType: 'full' | 'partial' | 'custom' | 'bundle';
                    description?: string;
                    serviceId?: string;
                    promotionId?: string;
                };
            },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            return createPlan({...input, price: String(input.price)});
        },
        updatePlan: async (
            _: unknown,
            {id, input}: {
                id: string;
                input: {
                    name?: string;
                    durationMonths?: number;
                    price?: number;
                    currencyCode?: string;
                    planType?: 'full' | 'partial' | 'custom' | 'bundle';
                    description?: string;
                    isActive?: boolean
                }
            },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            const {price, ...rest} = input;
            const updateData = price !== undefined
                ? {...rest, price: String(price)}
                : rest;
            const plan = await updatePlan(id, updateData);
            if (!plan) throw new Error(`Plan ${id} not found`);
            return plan;
        },
        deletePlan: async (
            _: unknown,
            {id}: { id: string },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            return deletePlan(id);
        },
    },
    Plan: {
        price: (parent: { price: string }) => parseFloat(parent.price),
        service: (parent: { serviceId?: string | null }) =>
            parent.serviceId ? getServiceById(parent.serviceId) : null,
        promotion: (parent: { promotionId?: string | null }) =>
            parent.promotionId ? getPromotionById(parent.promotionId) : null,
    },
};
