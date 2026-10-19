import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const dialogPath = new URL('unassign-profile-dialog.tsx', import.meta.url);
const consolePath = new URL('streaming-accounts-console.tsx', import.meta.url);

test('requires confirmation and visible feedback before unassigning a profile', async () => {
  const [dialogSource, consoleSource] = await Promise.all([
    readFile(dialogPath, 'utf8'),
    readFile(consolePath, 'utf8'),
  ]);

  assert.match(dialogSource, /<AlertDialog/);
  assert.match(dialogSource, /<AlertDialogAction/);
  assert.match(dialogSource, /membershipId/);
  assert.doesNotMatch(dialogSource, /window\.confirm/);
  assert.match(consoleSource, /useUnassignProfile/);
  assert.match(consoleSource, /<UnassignProfileDialog/);
  assert.match(consoleSource, /toast\.success/);
});
