import { requireAdmin, requireAuth } from '@/lib/graphql/resolvers/guards';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from '@/modules/clients/server/repositories/clients.repository';
import {
  getSubscriptionsByClient,
  countActiveSubscriptionsByClient,
} from '@/modules/subscriptions/server/repositories/subscriptions.repository';
import type { GraphQLContext } from '@/lib/graphql/context';
import { reconcileSavedRichTextField } from '@/modules/rich-text/server/services/rich-text-assets.service';

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
      {
        input,
      }: {
        input: { name: string; email?: string; phone?: string; notes?: unknown };
      },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      const client = await createClient(input);
      await reconcileSavedRichTextField({
        entityId: client.id,
        entityType: 'client',
        fieldName: 'notes',
        previousValue: null,
        nextValue: client.notes,
      });
      return client;
    },
    updateClient: async (
      _: unknown,
      {
        id,
        input,
      }: {
        id: string;
        input: {
          name?: string;
          email?: string;
          phone?: string;
          notes?: unknown;
          isActive?: boolean;
        };
      },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      const previous = await getClientById(id);
      const client = await updateClient(id, input);
      if (!client) throw new Error(`Client ${id} not found`);
      await reconcileSavedRichTextField({
        entityId: client.id,
        entityType: 'client',
        fieldName: 'notes',
        previousValue: previous?.notes,
        nextValue: client.notes,
      });
      return client;
    },
    deleteClient: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
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
