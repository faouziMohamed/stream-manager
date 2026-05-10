import { GraphQLError } from 'graphql';
import { requireAdmin, requireAuth } from '@/lib/graphql/resolvers/guards';
import {
  createService,
  getAllServices,
  getDeletedServices,
  getServiceById,
  hardDeleteService,
  softDeleteService,
  updateService,
} from '@/modules/services/server/repositories/services.repository';
import { getPlansByService } from '@/modules/services/server/repositories/plans.repository';
import { createLogger } from '@/lib/logger';
import type { GraphQLContext } from '@/lib/graphql/context';

const logger = createLogger('services-resolvers');

export const servicesResolvers = {
  Query: {
    services: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return getAllServices();
    },
    service: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return getServiceById(id);
    },
    deletedServices: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAdmin(ctx);
      return getDeletedServices();
    },
  },
  Mutation: {
    createService: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          name: string;
          category: string;
          description?: string;
          logoUrl?: string;
          showOnHomepage?: boolean;
        };
      },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      return createService(input);
    },
    updateService: async (
      _: unknown,
      {
        id,
        input,
      }: {
        id: string;
        input: {
          name?: string;
          category?: string;
          description?: string;
          logoUrl?: string;
          isActive?: boolean;
          showOnHomepage?: boolean;
        };
      },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      const service = await updateService(id, input);
      if (!service)
        throw new GraphQLError(`Service ${id} introuvable`, {
          extensions: { code: 'NOT_FOUND' },
        });
      return service;
    },
    deleteService: async (
      _: unknown,
      { id, force }: { id: string; force?: boolean },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      try {
        if (force) {
          return await hardDeleteService(id);
        }
        return await softDeleteService(id);
      } catch (error: unknown) {
        const cause = (error as { cause?: { code?: string } })?.cause;
        if (cause?.code === '23503') {
          throw new GraphQLError(
            'Ce service ne peut pas être supprimé car des abonnements y sont encore liés.',
            { extensions: { code: 'CONSTRAINT_VIOLATION' } }
          );
        }
        logger.error({ id, err: error }, 'Failed to delete service');
        throw error;
      }
    },
    restoreService: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAdmin(ctx);
      const service = await updateService(id, { deletedAt: null } as never);
      if (!service)
        throw new GraphQLError(`Service ${id} introuvable`, {
          extensions: { code: 'NOT_FOUND' },
        });
      logger.info({ id }, 'Restored service');
      return service;
    },
  },
  Service: {
    plans: (parent: { id: string }) => getPlansByService(parent.id),
  },
};
