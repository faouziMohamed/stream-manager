import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

test('timeline console exposes a localized refresh control and UI freshness copy', async () => {
  const source = await readFile(new URL('timeline-console.tsx', import.meta.url), 'utf8');
  const views = await readFile(new URL('timeline-console.views.tsx', import.meta.url), 'utf8');

  assert.match(source, /ConsoleRefreshButton/);
  assert.match(source, /Refresh timeline/);
  assert.match(source, /Updated just now/);
  assert.match(source, /Refreshing/);
  assert.match(views, /statusPillClass\(item\.status\)/);
  assert.doesNotMatch(views, /ITEM_TONES|TableView/);
  assert.match(views, /item\.planName/);
});
