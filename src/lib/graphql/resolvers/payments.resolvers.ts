import { requireAdmin, requireAuth } from './guards';
import {
  getAllPayments,
  getPaymentById,
  updatePayment,
  markPaymentPaid,
} from '@/lib/db/repositories/payments.repository';
import { getSubscriptionById } from '@/lib/db/repositories/subscriptions.repository';
import type { GraphQLContext } from '../context';

export const paymentsResolvers = {
  Query: {
    payments: async (
      _: unknown,
      { subscriptionId, status, fromDate, toDate }: {
        subscriptionId?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
      },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return getAllPayments({ subscriptionId, status, fromDate, toDate });
    },
    payment: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return getPaymentById(id);
    },
  },
  Mutation: {
    updatePayment: async (
      _: unknown,
      { id, input }: {
        id: string;
        input: { status?: 'paid' | 'unpaid' | 'overdue'; paidDate?: string; notes?: string };
      },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const payment = await updatePayment(id, input);
      if (!payment) throw new Error(`Payment ${id} not found`);
      return payment;
    },
    markPaymentPaid: async (
      _: unknown,
      { id, paidDate }: { id: string; paidDate?: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const payment = await markPaymentPaid(id, paidDate);
      if (!payment) throw new Error(`Payment ${id} not found`);
      return payment;
    },
  },
  Payment: {
    amount: (parent: { amount: string }) => parseFloat(parent.amount),
    subscription: (parent: { subscriptionId: string }) =>
      getSubscriptionById(parent.subscriptionId),
  },
};
