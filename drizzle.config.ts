import { defineConfig } from 'drizzle-kit';

// drizzle-kit runs outside the Next.js runtime, so it reads process.env
// directly instead of going through src/lib/settings/env.ts.
const databaseUrl = process.env.DATABASE_URL;
const sslCa = process.env.DB_SSL_CA;

if (databaseUrl === undefined || databaseUrl.length === 0) {
  throw new Error('DATABASE_URL must be set to run drizzle-kit');
}

function createDbCredentials() {
  if (sslCa === undefined || sslCa.length === 0) {
    return { url: databaseUrl as string };
  }

  const parsed = new URL(databaseUrl as string);

  return {
    database: parsed.pathname.replace(/^\//, ''),
    host: parsed.hostname,
    password: decodeURIComponent(parsed.password),
    port: Number(parsed.port || '5432'),
    ssl: {
      ca: sslCa,
      rejectUnauthorized: true,
    },
    user: decodeURIComponent(parsed.username),
  };
}

export default defineConfig({
  dbCredentials: createDbCredentials(),
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/server/lib/db/tables/*.ts',
});
