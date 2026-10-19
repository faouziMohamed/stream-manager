import { existsSync } from 'node:fs';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// The server layer reads process.env through src/lib/settings/env.ts. Next.js
// loads .env for us at runtime; Vitest does not, so do it here.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    exclude: ['node_modules', '.next', 'e2e/**', 'dist'],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    // Repository tests talk to a real database; keep them off each other's toes.
    // Component tests opt into jsdom with a `// @vitest-environment jsdom` docblock.
    fileParallelism: false,
  },
});
