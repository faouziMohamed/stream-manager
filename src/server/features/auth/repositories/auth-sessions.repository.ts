import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/server/lib/db/client';
import { authSessionsTable } from '@/server/lib/db/tables/auth.table';

export async function createAuthSession(input: CreateAuthSessionInput) {
  const [session] = await db
    .insert(authSessionsTable)
    .values({
      browser: input.browser ?? null,
      countryCode: input.countryCode ?? null,
      deviceType: input.deviceType ?? null,
      id: input.id,
      ipHash: input.ipHash ?? null,
      os: input.os ?? null,
      userId: input.userId,
    })
    .returning();

  return session;
}

export async function findActiveAuthSessionById(sessionId: string) {
  const [session] = await db
    .select()
    .from(authSessionsTable)
    .where(and(eq(authSessionsTable.id, sessionId), isNull(authSessionsTable.revokedAt)))
    .limit(1);

  return session ?? null;
}

export async function listActiveAuthSessionsByUserId(userId: string) {
  return db
    .select()
    .from(authSessionsTable)
    .where(and(eq(authSessionsTable.userId, userId), isNull(authSessionsTable.revokedAt)))
    .orderBy(desc(authSessionsTable.lastUsedAt));
}

export async function revokeAuthSessionById(userId: string, sessionId: string) {
  const [session] = await db
    .update(authSessionsTable)
    .set({
      revokedAt: new Date(),
      revokedReason: 'manual_logout',
      updatedAt: new Date(),
    })
    .where(and(eq(authSessionsTable.id, sessionId), eq(authSessionsTable.userId, userId)))
    .returning();

  return session ?? null;
}

export async function revokeAllAuthSessionsByUserId(userId: string) {
  return db
    .update(authSessionsTable)
    .set({
      revokedAt: new Date(),
      revokedReason: 'logout_all_devices',
      updatedAt: new Date(),
    })
    .where(eq(authSessionsTable.userId, userId))
    .returning();
}

export async function updateLastUsed(sessionId: string) {
  const [session] = await db
    .update(authSessionsTable)
    .set({
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(authSessionsTable.id, sessionId))
    .returning();

  return session ?? null;
}

interface CreateAuthSessionInput {
  browser?: string | null;
  countryCode?: string | null;
  deviceType?: string | null;
  id: string;
  ipHash?: string | null;
  os?: string | null;
  userId: string;
}
