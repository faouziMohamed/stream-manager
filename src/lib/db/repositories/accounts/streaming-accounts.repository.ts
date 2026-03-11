import { and, count, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  type StreamingAccount,
  streamingAccounts,
  type StreamingProfile,
  streamingProfiles,
  type SubscriptionProfile,
  subscriptionProfiles,
} from "@/lib/db/tables/subscription-management.table";
import { createLogger } from "@/lib/logger";

const logger = createLogger("streaming-accounts-repository");

export async function getAllAccounts() {
  return db.select().from(streamingAccounts).orderBy(streamingAccounts.label);
}

export async function getAccountById(id: string) {
  const [row] = await db
    .select()
    .from(streamingAccounts)
    .where(eq(streamingAccounts.id, id));
  return row ?? null;
}

export async function getAccountsByService(serviceId: string) {
  return db
    .select()
    .from(streamingAccounts)
    .where(eq(streamingAccounts.serviceId, serviceId));
}

export type CreateAccountInput = {
  serviceId: string;
  label: string;
  email?: string | null;
  phone?: string | null;
  supportsProfiles?: boolean;
  maxProfiles?: number;
  notes?: string | null;
};

export async function createAccount(
  input: CreateAccountInput,
): Promise<StreamingAccount> {
  const id = nanoid();
  const [row] = await db
    .insert(streamingAccounts)
    .values({
      id,
      serviceId: input.serviceId,
      label: input.label,
      email: input.email ?? null,
      phone: input.phone ?? null,
      supportsProfiles: input.supportsProfiles ?? true,
      maxProfiles: input.maxProfiles ?? 1,
      notes: input.notes ?? null,
      isActive: true,
    })
    .returning();
  logger.info({ id }, "Account created");
  return row!;
}

export type UpdateAccountInput = Partial<
  Omit<CreateAccountInput, "serviceId"> & { isActive: boolean }
>;

export async function updateAccount(
  id: string,
  input: UpdateAccountInput,
): Promise<StreamingAccount> {
  const [row] = await db
    .update(streamingAccounts)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(streamingAccounts.id, id))
    .returning();
  logger.info({ id }, "Account updated");
  return row!;
}

export async function deleteAccount(id: string): Promise<boolean> {
  await db.delete(streamingAccounts).where(eq(streamingAccounts.id, id));
  logger.info({ id }, "Account deleted");
  return true;
}

export async function countAssignedProfilesByAccount(
  accountId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(subscriptionProfiles)
    .where(eq(subscriptionProfiles.accountId, accountId));
  return row?.value ?? 0;
}

export async function getAccountLevelAssignment(accountId: string) {
  const [row] = await db
    .select()
    .from(subscriptionProfiles)
    .where(
      and(
        eq(subscriptionProfiles.accountId, accountId),
        isNull(subscriptionProfiles.profileId),
      ),
    );
  return row ?? null;
}
