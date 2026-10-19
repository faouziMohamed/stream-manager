import { eq } from 'drizzle-orm';
import { db } from '@/server/lib/db/client';
import { authUsersTable } from '@/server/lib/db/tables/auth.table';

export async function listAuthUsers() {
  return db.select().from(authUsersTable);
}

export async function updateAuthUserRole(
  id: string,
  role: 'admin' | 'accountant' | 'user'
): Promise<typeof authUsersTable.$inferSelect | null> {
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

export async function deleteAuthUser(
  id: string
): Promise<typeof authUsersTable.$inferSelect | null> {
  const [user] = await db.delete(authUsersTable).where(eq(authUsersTable.id, id)).returning();

  return user ?? null;
}
