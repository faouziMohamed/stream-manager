import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '@/lib/settings/env';
import * as schema from './schema';

// SSL CA cert from env
const ssl = env.DB_SSL_CA ? { ca: env.DB_SSL_CA } : undefined;

const client = postgres(env.DATABASE_URL, {
  ssl,
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
