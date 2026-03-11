import { db } from "@/lib/db";
import { summaryLinks } from "@/lib/db/tables/subscription-management.table";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function getAllSummaryLinks() {
  try {
    return await db.select().from(summaryLinks);
  } catch {
    return [];
  }
}

export async function getSummaryLinkByToken(token: string) {
  try {
    const [link] = await db
      .select()
      .from(summaryLinks)
      .where(eq(summaryLinks.token, token));
    return link ?? null;
  } catch {
    return null;
  }
}

export type CreateSummaryLinkInput = {
  label?: string | null;
  showSensitiveInfo: boolean;
  expiresAt?: string | null;
  baseUrl: string;
};

export async function createSummaryLink(input: CreateSummaryLinkInput) {
  const id = nanoid();
  const token = nanoid(16);
  const [link] = await db
    .insert(summaryLinks)
    .values({
      id,
      token,
      label: input.label ?? null,
      showSensitiveInfo: input.showSensitiveInfo,
      isActive: true,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning();
  return { ...link, shareUrl: `${input.baseUrl}/s/${token}` };
}

export async function deleteSummaryLink(id: string) {
  await db.delete(summaryLinks).where(eq(summaryLinks.id, id));
}

export async function toggleSummaryLink(
  id: string,
  isActive: boolean,
  baseUrl: string,
) {
  const [link] = await db
    .update(summaryLinks)
    .set({ isActive })
    .where(eq(summaryLinks.id, id))
    .returning();
  return { ...link, shareUrl: `${baseUrl}/s/${link.token}` };
}
