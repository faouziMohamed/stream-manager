import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  type SubscriptionProfile,
  subscriptionProfiles,
} from "@/lib/db/tables/subscription-management.table";
import { createLogger } from "@/lib/logger";

const logger = createLogger("profile-assignments-repository");

export async function getAssignmentsBySubscription(subscriptionId: string) {
  return db
    .select()
    .from(subscriptionProfiles)
    .where(eq(subscriptionProfiles.subscriptionId, subscriptionId));
}

export async function getAssignmentsByAccount(accountId: string) {
  return db
    .select()
    .from(subscriptionProfiles)
    .where(eq(subscriptionProfiles.accountId, accountId));
}

export async function getAssignmentsByProfile(profileId: string) {
  return db
    .select()
    .from(subscriptionProfiles)
    .where(eq(subscriptionProfiles.profileId, profileId));
}

export async function assignSubscriptionToProfile(
  subscriptionId: string,
  accountId: string,
  profileId?: string | null,
): Promise<SubscriptionProfile> {
  await db
    .delete(subscriptionProfiles)
    .where(eq(subscriptionProfiles.subscriptionId, subscriptionId));
  const [row] = await db
    .insert(subscriptionProfiles)
    .values({
      id: nanoid(),
      subscriptionId,
      accountId,
      profileId: profileId ?? null,
    })
    .returning();
  logger.info(
    { subscriptionId, profileId },
    "Profile assigned to subscription",
  );
  return row!;
}

export async function removeAssignment(
  subscriptionId: string,
): Promise<boolean> {
  await db
    .delete(subscriptionProfiles)
    .where(eq(subscriptionProfiles.subscriptionId, subscriptionId));
  logger.info({ subscriptionId }, "Assignment removed");
  return true;
}
