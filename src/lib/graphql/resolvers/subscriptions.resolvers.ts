import { requireAdmin, requireAuth } from "./guards";
import {
  createSubscription,
  deleteSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  renewSubscription,
  updateSubscription,
} from "@/lib/db/repositories/subscriptions.repository";
import { getClientById } from "@/lib/db/repositories/clients.repository";
import { getPlanById } from "@/lib/db/repositories/services.repository";
import { getPaymentsBySubscription } from "@/lib/db/repositories/payments.repository";
import { getAdminEmail, sendNotification } from "@/lib/utils/mailer";
import type { GraphQLContext } from "../context";

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
      {
        input,
      }: {
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
      const sub = await createSubscription(input);

      // Notify admin — non-blocking
      const adminEmail = await getAdminEmail();
      if (adminEmail) {
        const client = await getClientById(sub.clientId);
        const plan = await getPlanById(sub.planId);
        await sendNotification("subscription_created", {
          to: adminEmail,
          subject: `🆕 Nouvel abonnement — ${client?.name ?? "Client inconnu"}`,
          text: `Un nouvel abonnement a été créé pour ${client?.name ?? "un client"} — formule : ${plan?.name ?? sub.planId}. Du ${sub.startDate} au ${sub.endDate}.`,
          html: `<p>Nouvel abonnement créé pour <strong>${client?.name ?? "un client"}</strong>.</p><p>Formule : <strong>${plan?.name ?? sub.planId}</strong><br/>Du ${sub.startDate} au ${sub.endDate}</p>`,
        });
      }

      return sub;
    },
    updateSubscription: async (
      _: unknown,
      {
        id,
        input,
      }: {
        id: string;
        input: {
          startDate?: string;
          isRecurring?: boolean;
          status?: "active" | "expired" | "paused" | "cancelled";
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
      {
        input,
      }: {
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
      const sub = await renewSubscription(input);

      // Notify admin — non-blocking
      const adminEmail = await getAdminEmail();
      if (adminEmail) {
        const client = await getClientById(sub.clientId);
        const plan = await getPlanById(sub.planId);
        await sendNotification("subscription_renewed", {
          to: adminEmail,
          subject: `🔄 Abonnement renouvelé — ${client?.name ?? "Client inconnu"}`,
          text: `L'abonnement de ${client?.name ?? "un client"} a été renouvelé — formule : ${plan?.name ?? sub.planId}. Du ${sub.startDate} au ${sub.endDate}.`,
          html: `<p>Abonnement renouvelé pour <strong>${client?.name ?? "un client"}</strong>.</p><p>Formule : <strong>${plan?.name ?? sub.planId}</strong><br/>Du ${sub.startDate} au ${sub.endDate}</p>`,
        });
      }

      return sub;
    },
  },
  Subscription: {
    client: (parent: { clientId: string }) => getClientById(parent.clientId),
    plan: (parent: { planId: string }) => getPlanById(parent.planId),
    payments: (parent: { id: string }) => getPaymentsBySubscription(parent.id),
  },
};
