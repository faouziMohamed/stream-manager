import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const loaderPath = new URL('streaming-accounts.loader.ts', import.meta.url);

test('composes service options with every membership the holders may point at', async () => {
  const source = await readFile(loaderPath, 'utf8');

  assert.match(source, /ListStreamingAccountServiceOptionsDocument/);
  assert.match(source, /ListStreamingAccountMembershipOptionsDocument/);
  assert.match(source, /Promise\.all/);
  assert.match(source, /serviceOptions/);
  assert.match(source, /membershipOptions/);
  // Every membership, not only the active ones: an assignment outlives the
  // term it was made on, and filtering to `active` turned those holders into
  // "Unknown customer / Unknown plan" on the account page.
  assert.match(source, /status: null/);
  assert.doesNotMatch(source, /status: ["']active["']/);
});
