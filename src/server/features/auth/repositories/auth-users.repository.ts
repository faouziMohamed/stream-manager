import { eq } from 'drizzle-orm';

import { db } from '@/server/lib/db/client';
import { authUsersTable } from '@/server/lib/db/tables/auth.table';

export async function createAuthUser(input: CreateAuthUserInput) {
  const [user] = await db
    .insert(authUsersTable)
    .values({
      avatar: input.avatar ?? null,
      email: input.email,
      id: input.id,
      name: input.name,
      passwordHash: input.passwordHash ?? null,
      role: input.role ?? 'user',
    })
    .returning();

  return user;
}

/** Every administrator's address, for operator-facing notifications. */
export async function findAdminEmails(): Promise<string[]> {
  const rows = await db
    .select({ email: authUsersTable.email })
    .from(authUsersTable)
    .where(eq(authUsersTable.role, 'admin'));

  return rows.map((row) => row.email);
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(authUsersTable)
    .where(eq(authUsersTable.email, email))
    .limit(1);
  return user ?? null;
}

export async function findUserById(id: string): Promise<typeof authUsersTable.$inferSelect | null> {
  const [user] = await db.select().from(authUsersTable).where(eq(authUsersTable.id, id)).limit(1);
  return user ?? null;
}

export async function updateAuthUserProfile(
  id: string,
  input: Pick<CreateAuthUserInput, 'avatar' | 'name'>
) {
  const [user] = await db
    .update(authUsersTable)
    .set({
      avatar: input.avatar ?? null,
      name: input.name,
      updatedAt: new Date(),
    })
    .where(eq(authUsersTable.id, id))
    .returning();

  return user ?? null;
}

export async function updateAuthUserRole(
  id: string,
  role: NonNullable<CreateAuthUserInput['role']>
) {
  const [user] = await db
    .update(authUsersTable)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(authUsersTable.id, id))
    .returning();

  return user ?? null;
}

interface CreateAuthUserInput {
  avatar?: string | null;
  email: string;
  id: string;
  name: string;
  passwordHash?: string | null;
  role?: 'admin' | 'accountant' | 'user';
}
