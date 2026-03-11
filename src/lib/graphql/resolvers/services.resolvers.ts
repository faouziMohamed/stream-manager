import {requireAdmin, requireAuth} from './guards';
import {
    createService,
    deleteService,
    getAllServices,
    getPlansByService,
    getServiceById,
    updateService,
} from '@/lib/db/repositories/services.repository';
import type {GraphQLContext} from '../context';

export const servicesResolvers = {
    Query: {
        services: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
            requireAuth(ctx);
            return getAllServices();
        },
        service: async (_: unknown, {id}: { id: string }, ctx: GraphQLContext) => {
            requireAuth(ctx);
            return getServiceById(id);
        },
    },
    Mutation: {
        createService: async (
            _: unknown,
            {input}: {
                input: {
                    name: string;
                    category: string;
                    description?: string;
                    logoUrl?: string;
                    showOnHomepage?: boolean
                }
            },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            return createService(input);
        },
        updateService: async (
            _: unknown,
            {id, input}: {
                id: string;
                input: {
                    name?: string;
                    category?: string;
                    description?: string;
                    logoUrl?: string;
                    isActive?: boolean;
                    showOnHomepage?: boolean
                }
            },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            const service = await updateService(id, input);
            if (!service) throw new Error(`Service ${id} not found`);
            return service;
        },
        deleteService: async (
            _: unknown,
            {id}: { id: string },
            ctx: GraphQLContext,
        ) => {
            requireAdmin(ctx);
            return deleteService(id);
        },
    },
    Service: {
        plans: (parent: { id: string }) => getPlansByService(parent.id),
    },
};
