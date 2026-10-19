import { and, asc, eq } from 'drizzle-orm';

import {
  customersTable,
  membershipsTable,
  paymentsTable,
} from '@/server/lib/db/tables/membership-management.table';
import {
  streamingAccountsTable,
  streamingProfileAssignmentsTable,
  streamingProfilesTable,
} from '@/server/lib/db/tables/streaming-accounts.table';

/**
 * Free profiles on active accounts for a service, oldest first.
 *
 * "Free" means the profile row is not flagged as assigned. The flag is the
 * authority — createSubscription re-checks it inside the transaction, so a
 * profile listed here can still lose the race and that is handled there.
 */
export async function findAvailableProfilesByServiceId(serviceId: string) {
  const db = await getDb();

  return db
    .select({
      accountId: streamingAccountsTable.id,
      accountLabel: streamingAccountsTable.label,
      profileId: streamingProfilesTable.id,
      profileName: streamingProfilesTable.name,
    })
    .from(streamingProfilesTable)
    .innerJoin(
      streamingAccountsTable,
      eq(streamingProfilesTable.accountId, streamingAccountsTable.id)
    )
    .where(
      and(
        eq(streamingAccountsTable.serviceId, serviceId),
        eq(streamingAccountsTable.isActive, true),
        eq(streamingProfilesTable.isAssigned, false)
      )
    )
    .orderBy(asc(streamingProfilesTable.createdAt));
}

/**
 * Writes an entire subscription in one transaction: the customer (when new),
 * the membership, its first payment, and the streaming profile claim.
 *
 * Doing this in a single transaction is the point of the simplified flow —
 * previously an operator ran four separate mutations and any failure left a
 * half-built subscription behind.
 */
export async function insertSubscription(input: InsertSubscriptionInput) {
  const db = await getDb();

  return db.transaction(async (tx) => {
    const customerId = await resolveCustomerId(tx, input);

    if (customerId === null) {
      return null;
    }

    const [membership] = await tx
      .insert(membershipsTable)
      .values({ ...input.membership, customerId })
      .returning();

    if (membership === undefined) {
      return null;
    }

    const [payment] = await tx
      .insert(paymentsTable)
      .values({ ...input.payment, customerId, membershipId: membership.id })
      .returning();

    if (payment === undefined) {
      return null;
    }

    const assignment = await claimProfile(tx, input, membership.id);

    return { assignment, customerId, membership, payment };
  });
}

async function resolveCustomerId(
  tx: Transaction,
  input: InsertSubscriptionInput
): Promise<string | null> {
  if (input.newCustomer === null) {
    return input.existingCustomerId;
  }

  const [customer] = await tx.insert(customersTable).values(input.newCustomer).returning();

  return customer?.id ?? null;
}

async function claimProfile(tx: Transaction, input: InsertSubscriptionInput, membershipId: string) {
  if (input.profile === null) {
    return null;
  }

  // Conditional update: whoever flips isAssigned false -> true first wins, so
  // two operators assigning the same profile cannot both succeed.
  const [profile] = await tx
    .update(streamingProfilesTable)
    .set({ isAssigned: true, updatedAt: new Date() })
    .where(
      and(
        eq(streamingProfilesTable.id, input.profile.profileId),
        eq(streamingProfilesTable.isAssigned, false)
      )
    )
    .returning();

  if (profile === undefined) {
    throw new ProfileAlreadyClaimedError();
  }

  const [assignment] = await tx
    .insert(streamingProfileAssignmentsTable)
    .values({
      accountId: input.profile.accountId,
      id: input.profile.assignmentId,
      membershipId,
      profileId: input.profile.profileId,
    })
    .returning();

  return assignment ?? null;
}

/** Thrown inside the transaction so the whole subscription rolls back. */
export class ProfileAlreadyClaimedError extends Error {
  constructor() {
    super('Streaming profile was claimed by someone else');
    this.name = 'ProfileAlreadyClaimedError';
  }
}

async function getDb() {
  const { db } = await import('@/server/lib/db/client');
  return db;
}

type Transaction = Parameters<Parameters<Awaited<ReturnType<typeof getDb>>['transaction']>[0]>[0];

type InsertSubscriptionInput = {
  existingCustomerId: string;
  membership: Omit<typeof membershipsTable.$inferInsert, 'customerId'>;
  newCustomer: typeof customersTable.$inferInsert | null;
  payment: Omit<typeof paymentsTable.$inferInsert, 'customerId' | 'membershipId'>;
  profile: { accountId: string; assignmentId: string; profileId: string } | null;
};
