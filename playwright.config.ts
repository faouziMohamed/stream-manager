import path from 'node:path';

import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

// Saved authenticated browser state (cookies + storage) produced by the
// `auth.setup.ts` project and reused by the authenticated console project.
export const STORAGE_STATE = path.join(process.cwd(), 'e2e', '.auth', 'admin.json');

// Authenticated E2E needs a reachable backend and a seeded operator account.
// When credentials are absent we run only the public/unauthenticated specs.
const authEnabled = Boolean(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD);

// Dummy env so the Next.js server boots without the real API/DB.
const serverEnv = {
  GITHUB_CLIENT_ID: 'e2e-github-id',
  GITHUB_CLIENT_SECRET: 'e2e-github-secret',
  GOOGLE_CLIENT_ID: 'e2e-google-id',
  GOOGLE_CLIENT_SECRET: 'e2e-google-secret',
  NEXT_PUBLIC_APP_URL: BASE_URL,
  NEXT_PUBLIC_WS_URL: 'http://localhost:4999',
  NEXTAUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-0123',
  NEXTAUTH_URL: BASE_URL,
  PORT: String(PORT),
  STREAM_API_URL: process.env.STREAM_API_URL ?? 'http://localhost:4999',
};

const desktopChrome = { ...devices['Desktop Chrome'] };

const projects: NonNullable<PlaywrightTestConfig['projects']> = [
  // Unauthenticated specs (public site + auth gating). Never touch console/.
  {
    name: 'chromium',
    use: desktopChrome,
    testIgnore: '**/console/**',
  },
];

if (authEnabled) {
  // 1) Log in once and persist the session.
  projects.unshift({ name: 'setup', testMatch: /.*\.setup\.ts/ });
  // 2) Console specs reuse the saved session — no per-test login.
  projects.push({
    name: 'chromium-authenticated',
    testMatch: '**/console/**/*.spec.ts',
    use: { ...desktopChrome, storageState: STORAGE_STATE },
    dependencies: ['setup'],
  });
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects,
  webServer: {
    command: 'pnpm dev',
    url: BASE_URL,
    env: serverEnv,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
