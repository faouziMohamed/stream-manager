import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: process.env.DB_SSL_CA
      ? { ca: process.env.DB_SSL_CA }
      : undefined,
  },
} satisfies Config;
