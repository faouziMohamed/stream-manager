import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const actionPath = new URL('streaming-accounts.action.ts', import.meta.url);
const graphQlPath = new URL('../graphql/streaming-accounts.graphql', import.meta.url);

test('exposes account creation and profile assignment through the BFF', async () => {
  const [actionSource, graphQlSource] = await Promise.all([
    readFile(actionPath, 'utf8'),
    readFile(graphQlPath, 'utf8'),
  ]);

  assert.match(graphQlSource, /mutation CreateStreamingAccount/);
  assert.match(graphQlSource, /mutation AssignProfileToMembership/);
  assert.match(graphQlSource, /query ListStreamingAccountServiceOptions/);
  assert.match(graphQlSource, /query ListStreamingAccountMembershipOptions/);
  assert.match(actionSource, /createStreamingAccountAction/);
  assert.match(actionSource, /assignProfileToMembershipAction/);
  assert.match(actionSource, /await requireSession\(/);
});
