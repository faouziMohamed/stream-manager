import { and, eq } from 'drizzle-orm';

import {
  streamingAccountsTable,
  streamingProfileAssignmentsTable,
  streamingProfilesTable,
} from '@/server/lib/db/tables/streaming-accounts.table';

export async function insertStreamingAccount(input: InsertStreamingAccount) {
  const db = await getDb();
  const [account] = await db.insert(streamingAccountsTable).values(input).returning();

  if (account === undefined) {
    return null;
  }

  return account;
}

export async function findStreamingAccountById(id: string) {
  const db = await getDb();
  const [account] = await db
    .select()
    .from(streamingAccountsTable)
    .where(eq(streamingAccountsTable.id, id))
    .limit(1);

  return account ?? null;
}

export async function findStreamingAccounts() {
  const db = await getDb();
  return db.select().from(streamingAccountsTable).where(eq(streamingAccountsTable.isActive, true));
}

export async function updateStreamingAccount(
  id: string,
  input: Partial<
    Pick<
      InsertStreamingAccount,
      'email' | 'label' | 'maxProfiles' | 'passwordEncrypted' | 'supportsProfiles'
    >
  >
) {
  const db = await getDb();
  const [account] = await db
    .update(streamingAccountsTable)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(streamingAccountsTable.id, id))
    .returning();

  return account ?? null;
}

export async function softDeleteStreamingAccount(id: string) {
  const db = await getDb();
  const [account] = await db
    .update(streamingAccountsTable)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(streamingAccountsTable.id, id))
    .returning();

  return account ?? null;
}

export async function insertStreamingProfile(input: InsertStreamingProfile) {
  const db = await getDb();
  const [profile] = await db.insert(streamingProfilesTable).values(input).returning();

  if (profile === undefined) {
    return null;
  }

  return profile;
}

export async function findProfileById(id: string) {
  const db = await getDb();
  const [profile] = await db
    .select()
    .from(streamingProfilesTable)
    .where(eq(streamingProfilesTable.id, id))
    .limit(1);

  return profile ?? null;
}

export async function findProfilesByAccountId(accountId: string) {
  const db = await getDb();
  return db
    .select()
    .from(streamingProfilesTable)
    .where(eq(streamingProfilesTable.accountId, accountId));
}

export async function findAssignmentsByAccountId(accountId: string) {
  const db = await getDb();
  return db
    .select()
    .from(streamingProfileAssignmentsTable)
    .where(eq(streamingProfileAssignmentsTable.accountId, accountId));
}

export async function updateStreamingProfile(
  id: string,
  input: Partial<Pick<InsertStreamingProfile, 'name' | 'pinEncrypted'>>
) {
  const db = await getDb();
  const [profile] = await db
    .update(streamingProfilesTable)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(streamingProfilesTable.id, id))
    .returning();

  return profile ?? null;
}

export async function deleteStreamingProfile(id: string) {
  const db = await getDb();
  const [profile] = await db
    .delete(streamingProfilesTable)
    .where(eq(streamingProfilesTable.id, id))
    .returning();

  return profile ?? null;
}

export async function updateProfileAssigned(id: string, isAssigned: boolean) {
  const db = await getDb();
  const [profile] = await db
    .update(streamingProfilesTable)
    .set({
      isAssigned,
      updatedAt: new Date(),
    })
    .where(eq(streamingProfilesTable.id, id))
    .returning();

  return profile ?? null;
}

export async function insertAssignment(input: InsertAssignment) {
  const db = await getDb();
  const [assignment] = await db.insert(streamingProfileAssignmentsTable).values(input).returning();

  return assignment ?? null;
}

export async function createAssignmentAndMarkProfileAssigned(input: InsertAssignment) {
  const db = await getDb();

  return db.transaction(async (tx) => {
    if (input.profileId === null || input.profileId === undefined) {
      return null;
    }

    const [profile] = await tx
      .update(streamingProfilesTable)
      .set({
        isAssigned: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(streamingProfilesTable.id, input.profileId),
          eq(streamingProfilesTable.isAssigned, false)
        )
      )
      .returning();

    if (profile === undefined) {
      return null;
    }

    const [assignment] = await tx
      .insert(streamingProfileAssignmentsTable)
      .values(input)
      .returning();

    return assignment ?? null;
  });
}

export async function findAssignmentById(id: string) {
  const db = await getDb();
  const [assignment] = await db
    .select()
    .from(streamingProfileAssignmentsTable)
    .where(eq(streamingProfileAssignmentsTable.id, id))
    .limit(1);

  return assignment ?? null;
}

export async function deleteAssignment(id: string) {
  const db = await getDb();
  await db
    .delete(streamingProfileAssignmentsTable)
    .where(eq(streamingProfileAssignmentsTable.id, id));
}

export async function findActiveAssignmentByProfileId(profileId: string) {
  const db = await getDb();
  const [assignment] = await db
    .select()
    .from(streamingProfileAssignmentsTable)
    .where(eq(streamingProfileAssignmentsTable.profileId, profileId))
    .limit(1);

  return assignment ?? null;
}

async function getDb() {
  const { db } = await import('@/server/lib/db/client');
  return db;
}

type InsertStreamingAccount = typeof streamingAccountsTable.$inferInsert;
type InsertStreamingProfile = typeof streamingProfilesTable.$inferInsert;
type InsertAssignment = typeof streamingProfileAssignmentsTable.$inferInsert;
