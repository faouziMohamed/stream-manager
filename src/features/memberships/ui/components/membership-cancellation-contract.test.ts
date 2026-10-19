import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const consolePath = new URL('memberships-console.tsx', import.meta.url);

test('requires a confirm dialog before dispatching membership cancellation', async () => {
  const source = await readFile(consolePath, 'utf8');

  assert.match(source, /<ConfirmActionDialog/);
  assert.match(source, /setCancelMembershipId\(row\.id\)/);
  assert.match(source, /cancelMutation\.mutate\(cancelMembershipId/);
  assert.doesNotMatch(source, /onClick={\(\) => cancelMutation\.mutate\(row\.id\)}/);
});
