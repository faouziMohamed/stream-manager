import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { test } from 'vitest';

const uiDirectory = new URL('.', import.meta.url);

test('provides required library-backed interactive primitives', async () => {
  const files = await readdir(uiDirectory);

  assert.ok(files.includes('calendar.tsx'));
  assert.ok(files.includes('popover.tsx'));
  assert.ok(files.includes('switch.tsx'));
});
