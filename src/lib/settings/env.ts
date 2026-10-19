import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const placeholderSecretPatterns = [
  /^change[ _-]?me/i,
  /^replace[ _-]?me/i,
  /^your[ _-]?/i,
  /^example/i,
  /^todo/i,
  /^dummy/i,
  /<.*>/,
];

function isRealSecret(value: string): boolean {
  const normalized = value.trim();

  if (normalized.length === 0) {
    return false;
  }

  return !placeholderSecretPatterns.some((pattern) => pattern.test(normalized));
}

export const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    // --- Auth.js ---
    NEXTAUTH_SECRET: z
      .string()
      .min(1)
      .refine(isRealSecret, 'NEXTAUTH_SECRET must be a real secret, not a placeholder value'),
    NEXTAUTH_URL: z.string().url(),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),

    // --- Database ---
    DATABASE_URL: z.string().min(1),
    DB_SSL_CA: z.string().optional(),
    /**
     * Aiven's small plans allow 20 connections total. Leaving the pool at its
     * old size starved the database whenever another tool (an IDE, a second
     * process) connected, and the resulting TCP refusals surfaced as failed
     * page loads. Dev only needs a couple of connections; production states
     * its own value.
     */
    DB_POOL_MAX: z.coerce.number().int().positive().max(20).optional(),

    // --- Crypto ---
    ENCRYPTION_KEY: z
      .string()
      .length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters')
      .regex(/^[\dA-Fa-f]+$/, 'ENCRYPTION_KEY must be a hex string'),

    // --- Logging ---
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    LOG_PRETTY: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),

    // --- Scheduled jobs (see src/app/api/cron/*) ---
    CRON_SECRET: z.string().min(16).optional(),

    // --- Seed script ---
    SEED_AUTH_EMAIL: z.email().optional(),
    SEED_AUTH_NAME: z.string().trim().min(1).optional(),
    SEED_AUTH_PASSWORD: z.string().min(1).optional(),
    SEED_AUTH_ROLE: z.enum(['admin', 'accountant', 'user']).optional(),

    // Transactional email (membership + payment notifications) is configured
    // entirely from the environment — no in-app SMTP settings. When these are
    // unset, email sending is skipped instead of failing.
    SMTP_FROM_ADDRESS: z.string().trim().min(1).optional(),
    SMTP_FROM_NAME: z.string().trim().min(1).optional(),
    SMTP_HOST: z.string().trim().min(1).optional(),
    SMTP_PASSWORD: z.string().trim().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === 'true')),
    SMTP_USER: z.string().trim().min(1).optional(),

    // Media storage is configured entirely from the environment (no in-app
    // settings). STORAGE_PROVIDER selects the backend; the matching block below
    // must be supplied for uploads to work.
    // 'local' writes to disk under ./storage. It is what makes the
    // development fallback in storage.service.ts reachable at all.
    STORAGE_PROVIDER: z.enum(['s3', 'local']).default('s3'),
    S3_ACCESS_KEY_ID: z.string().trim().min(1).optional(),
    S3_BUCKET: z.string().trim().min(1).optional(),
    S3_ENDPOINT: z.string().trim().min(1).optional(),
    S3_FORCE_PATH_STYLE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    S3_PUBLIC_URL: z.string().trim().min(1).optional(),
    S3_REGION: z.string().trim().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().trim().min(1).optional(),

    // The console's default money. A plan or payment may still carry its own
    // code; this is what a figure without one is shown in, and it is the only
    // place MAD-like literals were allowed to hide.
    DEFAULT_CURRENCY: z
      .string()
      .trim()
      .length(3, 'DEFAULT_CURRENCY must be a three-letter ISO code')
      .default('MAD'),

    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_DEFAULT_CURRENCY: z.string().trim().length(3).default('MAD'),
  },
  runtimeEnv: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DB_SSL_CA: process.env.DB_SSL_CA,
    DB_POOL_MAX: process.env.DB_POOL_MAX,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_PRETTY: process.env.LOG_PRETTY,
    CRON_SECRET: process.env.CRON_SECRET,
    SEED_AUTH_EMAIL: process.env.SEED_AUTH_EMAIL,
    SEED_AUTH_NAME: process.env.SEED_AUTH_NAME,
    SEED_AUTH_PASSWORD: process.env.SEED_AUTH_PASSWORD,
    SEED_AUTH_ROLE: process.env.SEED_AUTH_ROLE,
    SMTP_FROM_ADDRESS: process.env.SMTP_FROM_ADDRESS,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
    S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
    S3_REGION: process.env.S3_REGION,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
    NODE_ENV: process.env.NODE_ENV,
  },
});
