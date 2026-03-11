import { GraphQLError } from "graphql";
import { requireAdmin, requireAuth } from "@/lib/graphql/resolvers/guards";
import {
  createService,
  getAllServices,
  getDeletedServices,
  getPlansByService,
  getServiceById,
  hardDeleteService,
  softDeleteService,
  updateService,
} from "@/lib/db/repositories/services.repository";
import { createLogger } from "@/lib/logger";
import type { GraphQLContext } from "@/lib/graphql/context";

const logger = createLogger("services-resolvers");

export const servicesResolvers = {
  Query: {
    services: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return getAllServices();
    },
    service: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
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
      ctx: GraphQLContext,
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
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const service = await updateService(id, input);
      if (!service)
        throw new GraphQLError(`Service ${id} introuvable`, {
          extensions: { code: "NOT_FOUND" },
        });
      return service;
    },
    deleteService: async (
      _: unknown,
      { id, force }: { id: string; force?: boolean },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      try {
        if (force) {
          return await hardDeleteService(id);
        }
        return await softDeleteService(id);
      } catch (err: unknown) {
        const cause = (err as { cause?: { code?: string } })?.cause;
        if (cause?.code === "23503") {
          throw new GraphQLError(
            "Ce service ne peut pas être supprimé car des abonnements y sont encore liés.",
            { extensions: { code: "CONSTRAINT_VIOLATION" } },
          );
        }
        logger.error({ id, err }, "Failed to delete service");
        throw err;
      }
    },
    restoreService: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const service = await updateService(id, { deletedAt: null } as never);
      if (!service)
        throw new GraphQLError(`Service ${id} introuvable`, {
          extensions: { code: "NOT_FOUND" },
        });
      logger.info({ id }, "Restored service");
      return service;
    },
  },
  Service: {
    plans: (parent: { id: string }) => getPlansByService(parent.id),
  },
};
