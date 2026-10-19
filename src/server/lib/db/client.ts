import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Sql } from 'postgres';

import { env } from '@/server/config/env';

// Next.js re-evaluates modules on every HMR recompile and across route
// bundles. Without caching on globalThis each reload would open a fresh pool
// and exhaust the database's connection slots, so the pool is created once per
// process and reused.
const globalForDb = globalThis as typeof globalThis & {
  __streamQueryClient?: Sql;
};

function createQueryClient(): Sql {
  const options =
    env.DB_SSL_CA === undefined
      ? { idle_timeout: 20, max: poolSize }
      : {
          idle_timeout: 20,
          max: poolSize,
          ssl: {
            ca: env.DB_SSL_CA,
            rejectUnauthorized: true,
          },
        };

  return postgres(env.DATABASE_URL, options);
}

// A dev session needs a couple of connections, not a pool that competes with
// the IDE's database tools and the database's own agents for Aiven's 20
// slots. `DB_POOL_MAX` overrides both defaults.
const poolSize = env.DB_POOL_MAX ?? (env.NODE_ENV === 'production' ? 10 : 2);

const queryClient = globalForDb.__streamQueryClient ?? createQueryClient();

if (env.NODE_ENV !== 'production') {
  globalForDb.__streamQueryClient = queryClient;
}

export const db = drizzle(queryClient);
export { queryClient };
