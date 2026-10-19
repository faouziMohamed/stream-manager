import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// Repository tests open a postgres pool; close it so the run can exit.
// jsdom component tests never touch the server layer, and importing it there
// would trip the client-side guard in src/lib/settings/env.ts.
afterAll(async () => {
  if (typeof window !== 'undefined') {
    return;
  }

  const { queryClient } = await import('@/server/lib/db/client');
  await queryClient.end({ timeout: 1 });
});
