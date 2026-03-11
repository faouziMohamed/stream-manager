import { and, count, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  type StreamingProfile,
  streamingProfiles,
} from "@/lib/db/tables/subscription-management.table";
import { decrypt, encrypt } from "@/lib/utils/encryption";
import { createLogger } from "@/lib/logger";

const logger = createLogger("streaming-profiles-repository");

function decryptProfile(
  row: StreamingProfile,
): StreamingProfile & { pin: string | null } {
  return { ...row, pin: decrypt(row.pinEncrypted) };
}

export async function getProfilesByAccount(accountId: string) {
  const rows = await db
    .select()
    .from(streamingProfiles)
    .where(eq(streamingProfiles.accountId, accountId))
    .orderBy(streamingProfiles.profileIndex);
  return rows.map(decryptProfile);
}

export async function getProfileById(id: string) {
  const [row] = await db
    .select()
    .from(streamingProfiles)
    .where(eq(streamingProfiles.id, id));
  return row ? decryptProfile(row) : null;
}

export async function countProfilesByAccount(
  accountId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(streamingProfiles)
    .where(eq(streamingProfiles.accountId, accountId));
  return row?.value ?? 0;
}

export async function profileIndexExistsInAccount(
  accountId: string,
  profileIndex: number,
  excludeProfileId?: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: streamingProfiles.id })
    .from(streamingProfiles)
    .where(
      and(
        eq(streamingProfiles.accountId, accountId),
        eq(streamingProfiles.profileIndex, profileIndex),
      ),
    );
  return rows.some((r) => r.id !== excludeProfileId);
}

export type CreateProfileInput = {
  accountId: string;
  name: string;
  profileIndex?: number;
  pin?: string | null;
};

export async function createProfile(input: CreateProfileInput) {
  const id = nanoid();
  const [row] = await db
    .insert(streamingProfiles)
    .values({
      id,
      accountId: input.accountId,
      name: input.name,
      profileIndex: input.profileIndex ?? 1,
      pinEncrypted: input.pin ? encrypt(input.pin) : null,
      isActive: true,
    })
    .returning();
  logger.info({ id }, "Profile created");
  return decryptProfile(row!);
}

export type UpdateProfileInput = Partial<{
  name: string;
  profileIndex: number;
  pin: string | null;
  isActive: boolean;
}>;

export async function updateProfile(id: string, input: UpdateProfileInput) {
  const { pin, ...rest } = input;
  const patch: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if ("pin" in input) {
    patch.pinEncrypted = pin ? encrypt(pin) : null;
  }
  const [row] = await db
    .update(streamingProfiles)
    .set(patch)
    .where(eq(streamingProfiles.id, id))
    .returning();
  logger.info({ id }, "Profile updated");
  return decryptProfile(row!);
}

export async function deleteProfile(id: string): Promise<boolean> {
  await db.delete(streamingProfiles).where(eq(streamingProfiles.id, id));
  logger.info({ id }, "Profile deleted");
  return true;
}
