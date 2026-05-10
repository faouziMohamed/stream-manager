import { requireAdmin, requireAuth } from '@/lib/graphql/resolvers/guards';
import {
  getAllPayments,
  getPaymentById,
  markPaymentPaid,
  updatePayment,
} from '@/modules/payments/server/repositories/payments.repository';
import { getSubscriptionById } from '@/modules/subscriptions/server/repositories/subscriptions.repository';
import { getClientById } from '@/modules/clients/server/repositories/clients.repository';
import { getAdminEmail, sendNotification } from '@/lib/utils/mailer';
import { formatCurrency } from '@/lib/utils/helpers';
import type { GraphQLContext } from '@/lib/graphql/context';

export const paymentsResolvers = {
  Query: {
    payments: async (
      _: unknown,
      {
        subscriptionId,
        status,
        fromDate,
        toDate,
      }: {
        subscriptionId?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
      },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      return getAllPayments({ subscriptionId, status, fromDate, toDate });
    },
    payment: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return getPaymentById(id);
    },
  },
  Mutation: {
    updatePayment: async (
      _: unknown,
      {
        id,
        input,
      }: {
        id: string;
        input: {
          status?: 'paid' | 'unpaid' | 'overdue';
          paidDate?: string;
          notes?: string;
        };
      },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      const payment = await updatePayment(id, input);
      if (!payment) throw new Error(`Payment ${id} not found`);

      // Send notifications based on new status
      const adminEmail = await getAdminEmail();
      if (adminEmail) {
        if (input.status === 'overdue') {
          const sub = await getSubscriptionById(payment.subscriptionId);
          const client = sub ? await getClientById(sub.clientId) : null;
          await sendNotification('payment_overdue', {
            to: adminEmail,
            subject: `⚠️ Paiement en retard — ${client?.name ?? 'Client inconnu'}`,
            text: `Le paiement de ${formatCurrency(Number(payment.amount), payment.currencyCode)} pour ${client?.name ?? 'un client'} est en retard (échéance : ${payment.dueDate}).`,
            html: `<p>Le paiement de <strong>${formatCurrency(Number(payment.amount), payment.currencyCode)}</strong> pour <strong>${client?.name ?? 'un client'}</strong> est en retard.</p><p>Échéance : ${payment.dueDate}</p>`,
          });
        } else if (input.status === 'paid') {
          const sub = await getSubscriptionById(payment.subscriptionId);
          const client = sub ? await getClientById(sub.clientId) : null;
          await sendNotification('payment_paid', {
            to: adminEmail,
            subject: `✅ Paiement reçu — ${client?.name ?? 'Client inconnu'}`,
            text: `Paiement de ${formatCurrency(Number(payment.amount), payment.currencyCode)} reçu pour ${client?.name ?? 'un client'}.`,
            html: `<p>Paiement de <strong>${formatCurrency(Number(payment.amount), payment.currencyCode)}</strong> reçu pour <strong>${client?.name ?? 'un client'}</strong>.</p>`,
          });
        }
      }

      return payment;
    },
    markPaymentPaid: async (
      _: unknown,
      { id, paidDate }: { id: string; paidDate?: string },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      const payment = await markPaymentPaid(id, paidDate);
      if (!payment) throw new Error(`Payment ${id} not found`);

      // Notify admin on payment received
      const adminEmail = await getAdminEmail();
      if (adminEmail) {
        const sub = await getSubscriptionById(payment.subscriptionId);
        const client = sub ? await getClientById(sub.clientId) : null;
        await sendNotification('payment_paid', {
          to: adminEmail,
          subject: `✅ Paiement reçu — ${client?.name ?? 'Client inconnu'}`,
          text: `Paiement de ${formatCurrency(Number(payment.amount), payment.currencyCode)} reçu pour ${client?.name ?? 'un client'}.`,
          html: `<p>Paiement de <strong>${formatCurrency(Number(payment.amount), payment.currencyCode)}</strong> reçu pour <strong>${client?.name ?? 'un client'}</strong>.</p>`,
        });
      }

      return payment;
    },
  },
  Payment: {
    amount: (parent: { amount: string }) => Number.parseFloat(parent.amount),
    subscription: (parent: { subscriptionId: string }) =>
      getSubscriptionById(parent.subscriptionId),
  },
};
