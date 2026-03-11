import { requireAdmin } from "@/lib/graphql/resolvers/guards";
import { db } from "@/lib/db";
import { summaryLinks } from "@/lib/db/tables/subscription-management.table";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { env } from "@/lib/settings/env";
import { getDashboardStats } from "@/lib/db/repositories/analytics.repository";
import { createLogger } from "@/lib/logger";
import type { GraphQLContext } from "@/lib/graphql/context";

const logger = createLogger("summary-links-resolvers");

export const summaryLinksQueryResolvers = {
  summaryLinks: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    return db.select().from(summaryLinks);
  },
  summaryByToken: async (_: unknown, { token }: { token: string }) => {
    const [link] = await db
      .select()
      .from(summaryLinks)
      .where(eq(summaryLinks.token, token));
    if (!link || !link.isActive) return null;
    if (link.expiresAt && link.expiresAt < new Date()) return null;
    const stats = await getDashboardStats();
    return { stats, showSensitiveInfo: link.showSensitiveInfo };
  },
};

export const summaryLinksMutationResolvers = {
  createSummaryLink: async (
    _: unknown,
    {
      label,
      showSensitiveInfo,
      expiresAt,
    }: { label?: string; showSensitiveInfo: boolean; expiresAt?: string },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    const id = nanoid();
    const token = nanoid(16);
    const baseUrl = env.BETTER_AUTH_URL;
    const [link] = await db
      .insert(summaryLinks)
      .values({
        id,
        token,
        label: label ?? null,
        showSensitiveInfo,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();
    logger.info({ id, token }, "Summary link created");
    return { ...link, shareUrl: `${baseUrl}/s/${token}` };
  },
  deleteSummaryLink: async (
    _: unknown,
    { id }: { id: string },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    await db.delete(summaryLinks).where(eq(summaryLinks.id, id));
    logger.info({ id }, "Summary link deleted");
    return true;
  },
  toggleSummaryLink: async (
    _: unknown,
    { id, isActive }: { id: string; isActive: boolean },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    const [link] = await db
      .update(summaryLinks)
      .set({ isActive })
      .where(eq(summaryLinks.id, id))
      .returning();
    logger.info({ id, isActive }, "Summary link toggled");
    return { ...link, shareUrl: `${env.BETTER_AUTH_URL}/s/${link.token}` };
  },
};
