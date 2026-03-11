import type {Config} from 'drizzle-kit';

const ca = process.env.DB_SSL_CA

export default {
    schema: './src/lib/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
        ssl: ca ? {ca, rejectUnauthorized: true} : undefined,
    },
} satisfies Config;
