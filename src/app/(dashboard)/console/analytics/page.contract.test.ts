import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

test('analytics page delegates chart rendering to the analytics console slice', async () => {
  const source = await readFile(new URL('page.tsx', import.meta.url), 'utf8');

  assert.match(source, /AnalyticsConsole/);
  assert.match(source, /ConsoleRefreshButton/);
  assert.match(source, /ANALYTICS_QUERY_KEY/);
});
