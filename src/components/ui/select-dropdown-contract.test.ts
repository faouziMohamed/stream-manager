import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const selectPath = new URL('select.tsx', import.meta.url);

// Base UI's `alignItemWithTrigger` defaults to true, which overlays the
// popup ON TOP of the trigger (macOS-native style) instead of dropping it
// below/above like a menu. Our selects must open beside the trigger.
test('select popup opens beside the trigger, not on top of it', async () => {
  const source = await readFile(selectPath, 'utf8');

  assert.match(source, /alignItemWithTrigger\s*=\s*false/);
});

// A popup wider than its trigger must grow from the trigger's start edge
// (flipping to the end edge on collision) — never centered, which spills
// symmetrically past both sides of the trigger.
test('select popup aligns to the trigger edge, not the middle', async () => {
  const source = await readFile(selectPath, 'utf8');

  assert.match(source, /align\s*=\s*'start'/);
});

// Locking the popup to the exact trigger width (`w-(--anchor-width)`)
// clips long option labels (e.g. plan options in the membership form).
// The popup must be at least trigger-wide but free to grow up to the
// viewport space Base UI reports via --available-width.
test('select popup grows to fit long option labels', async () => {
  const source = await readFile(selectPath, 'utf8');

  assert.doesNotMatch(source, /(?<![\w-])w-\(--anchor-width\)/);
  assert.match(source, /min-w-\[max\(var\(--anchor-width\),[^\]]+\)]/);
  assert.match(source, /max-w-\(--available-width\)/);
});
