import { requireAdmin, requireAuth } from './guards';
import {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  renewSubscription,
} from '@/lib/db/repositories/subscriptions.repository';
import { getClientById } from '@/lib/db/repositories/clients.repository';
import { getPlanById } from '@/lib/db/repositories/services.repository';
import { getPaymentsBySubscription } from '@/lib/db/repositories/payments.repository';
import type { GraphQLContext } from '../context';

export const subscriptionsResolvers = {
  Query: {
    subscriptions: async (
      _: unknown,
      { clientId, status }: { clientId?: string; status?: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return getAllSubscriptions(clientId, status);
    },
    subscription: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return getSubscriptionById(id);
    },
  },
  Mutation: {
    createSubscription: async (
      _: unknown,
      { input }: {
        input: {
          clientId: string;
          planId: string;
          startDate: string;
          isRecurring: boolean;
          notes?: string;
        };
      },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return createSubscription(input);
    },
    updateSubscription: async (
      _: unknown,
      { id, input }: {
        id: string;
        input: {
          startDate?: string;
          isRecurring?: boolean;
          status?: 'active' | 'expired' | 'paused' | 'cancelled';
          notes?: string;
        };
      },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const sub = await updateSubscription(id, input);
      if (!sub) throw new Error(`Subscription ${id} not found`);
      return sub;
    },
    deleteSubscription: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return deleteSubscription(id);
    },
    renewSubscription: async (
      _: unknown,
      { input }: {
        input: {
          subscriptionId: string;
          startDate: string;
          isRecurring: boolean;
          notes?: string;
        };
      },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return renewSubscription(input);
    },
  },
  Subscription: {
    client: (parent: { clientId: string }) => getClientById(parent.clientId),
    plan: (parent: { planId: string }) => getPlanById(parent.planId),
    payments: (parent: { id: string }) => getPaymentsBySubscription(parent.id),
  },
};
