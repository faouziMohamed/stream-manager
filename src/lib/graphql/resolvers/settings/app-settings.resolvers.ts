import { requireAdmin, requireAuth } from "@/lib/graphql/resolvers/guards";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/tables/subscription-management.table";
import { eq } from "drizzle-orm";
import { createLogger } from "@/lib/logger";
import type { GraphQLContext } from "@/lib/graphql/context";

const logger = createLogger("app-settings-resolvers");

export const appSettingsQueryResolvers = {
  appSetting: async (
    _: unknown,
    { key }: { key: string },
    ctx: GraphQLContext,
  ) => {
    requireAuth(ctx);
    const [setting] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key));
    return setting ?? null;
  },
  defaultCurrency: async () => {
    const [setting] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, "defaultCurrency"));
    return setting?.value ?? "MAD";
  },
};

export const appSettingsMutationResolvers = {
  setAppSetting: async (
    _: unknown,
    { key, value }: { key: string; value: string },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    await db
      .insert(appSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value, updatedAt: new Date() },
      });
    logger.info({ key }, "App setting updated");
    return { key, value };
  },
};
