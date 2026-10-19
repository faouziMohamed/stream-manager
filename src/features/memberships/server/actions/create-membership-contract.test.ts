import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const graphqlPath = new URL('../graphql/memberships.graphql', import.meta.url);
const actionPath = new URL('mutate-membership.action.ts', import.meta.url);

test('exposes createMembership through the authenticated membership server action', async () => {
  const [graphqlSource, actionSource] = await Promise.all([
    readFile(graphqlPath, 'utf8'),
    readFile(actionPath, 'utf8'),
  ]);

  assert.match(graphqlSource, /mutation CreateMembership/);
  assert.match(actionSource, /export async function createMembershipAction/);
  assert.match(actionSource, /CreateMembershipDocument/);
});
