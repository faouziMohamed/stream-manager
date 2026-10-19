import argon2 from 'argon2';

import { env } from '@/server/config/env';
import { createLogger } from '@/server/config/logger.config';
import { db, queryClient } from '@/server/lib/db/client';
import { authUsersTable } from '@/server/lib/db/tables/auth.table';
import { createResourceId } from '@/server/common/utils/resource-id';

const logger = createLogger('seed-auth-user');

async function main() {
  const email = env.SEED_AUTH_EMAIL;
  const name = env.SEED_AUTH_NAME;
  const password = env.SEED_AUTH_PASSWORD;
  const role = normalizeRole(env.SEED_AUTH_ROLE);

  if (email === undefined || name === undefined || password === undefined) {
    throw new Error('SEED_AUTH_EMAIL, SEED_AUTH_NAME, and SEED_AUTH_PASSWORD are required');
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const [user] = await db
    .insert(authUsersTable)
    .values({
      email,
      id: createResourceId('usr'),
      name,
      passwordHash,
      role,
    })
    .onConflictDoNothing({
      target: authUsersTable.email,
    })
    .returning();

  if (user === undefined) {
    logger.info({ email }, 'Auth user already exists; no row inserted');
  } else {
    logger.info({ email: user.email, id: user.id, role: user.role }, 'Auth user seeded');
  }

  await queryClient.end();
}

function normalizeRole(value: string | undefined) {
  if (value === 'admin' || value === 'accountant' || value === 'user') {
    return value;
  }

  return 'admin';
}

void main();
