import { requireAdmin } from "@/lib/graphql/resolvers/guards";
import { db } from "@/lib/db";
import {
  notificationEvents,
  notificationSettings,
} from "@/lib/db/tables/subscription-management.table";
import { desc } from "drizzle-orm";
import { createLogger } from "@/lib/logger";
import {
  NOTIFICATION_LABELS,
  type NotificationEventType,
} from "@/lib/utils/mailer";
import type { GraphQLContext } from "@/lib/graphql/context";

const logger = createLogger("notifications-resolvers");

export const notificationsQueryResolvers = {
  notificationSettings: async (
    _: unknown,
    __: unknown,
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    const rows = await db.select().from(notificationSettings);
    const map = new Map(rows.map((r) => [r.event, r]));
    return Object.entries(NOTIFICATION_LABELS).map(([event, label]) => ({
      event,
      label,
      enabled: map.get(event)?.enabled ?? true,
    }));
  },
  notificationHistory: async (
    _: unknown,
    { limit }: { limit?: number },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    return db
      .select()
      .from(notificationEvents)
      .orderBy(desc(notificationEvents.createdAt))
      .limit(limit ?? 50);
  },
};

export const notificationsMutationResolvers = {
  setNotificationSetting: async (
    _: unknown,
    { event, enabled }: { event: string; enabled: boolean },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    await db
      .insert(notificationSettings)
      .values({ event, enabled })
      .onConflictDoUpdate({
        target: notificationSettings.event,
        set: { enabled, updatedAt: new Date() },
      });
    logger.info({ event, enabled }, "Notification setting updated");
    return {
      event,
      label: NOTIFICATION_LABELS[event as NotificationEventType] ?? event,
      enabled,
    };
  },
};
