import { requireAdmin, requireAuth } from './guards';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from '@/lib/db/repositories/clients.repository';
import {
  getSubscriptionsByClient,
  countActiveSubscriptionsByClient,
} from '@/lib/db/repositories/subscriptions.repository';
import type { GraphQLContext } from '../context';

export const clientsResolvers = {
  Query: {
    clients: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return getAllClients();
    },
    client: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return getClientById(id);
    },
  },
  Mutation: {
    createClient: async (
      _: unknown,
      { input }: { input: { name: string; email?: string; phone?: string; notes?: string } },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return createClient(input);
    },
    updateClient: async (
      _: unknown,
      { id, input }: { id: string; input: { name?: string; email?: string; phone?: string; notes?: string; isActive?: boolean } },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const client = await updateClient(id, input);
      if (!client) throw new Error(`Client ${id} not found`);
      return client;
    },
    deleteClient: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return deleteClient(id);
    },
  },
  Client: {
    subscriptions: (parent: { id: string }) => getSubscriptionsByClient(parent.id),
    activeSubscriptionsCount: (parent: { id: string }) =>
      countActiveSubscriptionsByClient(parent.id),
  },
};
