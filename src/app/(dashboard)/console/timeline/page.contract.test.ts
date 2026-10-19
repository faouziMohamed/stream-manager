import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

test('timeline page delegates rendering to the timeline console slice', async () => {
  const source = await readFile(new URL('page.tsx', import.meta.url), 'utf8');

  assert.match(source, /TimelineConsole/);
  assert.match(source, /loadTimeline/);
});
