import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const consolePath = new URL('streaming-accounts-console.tsx', import.meta.url);
const pagePath = new URL(
  '../../../../app/(dashboard)/console/streaming-accounts/page.tsx',
  import.meta.url
);

test('wires account creation and profile assignment into the inventory console', async () => {
  const [consoleSource, pageSource] = await Promise.all([
    readFile(consolePath, 'utf8'),
    readFile(pagePath, 'utf8'),
  ]);

  assert.match(consoleSource, /useCreateStreamingAccount/);
  assert.match(consoleSource, /useAssignProfileToMembership/);
  assert.match(consoleSource, /<StreamingAccountCreateForm/);
  assert.match(consoleSource, /<StreamingAssignmentForm/);
  assert.match(consoleSource, /toast\.success/);
  assert.match(pageSource, /serviceOptions/);
  assert.match(pageSource, /membershipOptions/);
});
