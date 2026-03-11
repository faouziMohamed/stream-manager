import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/lib/settings/env";
import * as schema from "./schema";

// Singleton pattern — prevents connection pool exhaustion during Next.js hot reloads
declare global {
  var __pgClient: postgres.Sql | undefined;
}

function createClient() {
  const url = env.DATABASE_URL;
  const ca = env.DB_SSL_CA;
  return postgres(url, {
    ssl: ca ? { ca, rejectUnauthorized: true } : undefined,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
  });
}

const client: postgres.Sql =
  globalThis.__pgClient ?? (globalThis.__pgClient = createClient());

// In development, keep a reference so hot reloads reuse the same client
if (process.env.NODE_ENV !== "production") {
  globalThis.__pgClient = client;
}

export const db = drizzle(client, { schema });
export type DB = typeof db;
