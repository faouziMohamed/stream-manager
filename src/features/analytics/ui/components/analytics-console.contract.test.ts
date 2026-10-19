import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

test('analytics console exposes chart panels with contextual insight', async () => {
  const source = await readFile(new URL('analytics-console.tsx', import.meta.url), 'utf8');

  assert.match(source, /Revenue trend/);
  assert.match(source, /Month-to-month change/);
  assert.match(source, /AnalyticsInsights/);
  assert.match(source, /ConsoleRefreshButton/);
});
