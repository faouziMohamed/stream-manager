import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const actionPath = new URL('streaming-accounts.action.ts', import.meta.url);
const graphQlPath = new URL('../graphql/streaming-accounts.graphql', import.meta.url);

test('reads assignment IDs and exposes authenticated profile unassignment', async () => {
  const [actionSource, graphQlSource] = await Promise.all([
    readFile(actionPath, 'utf8'),
    readFile(graphQlPath, 'utf8'),
  ]);

  assert.match(graphQlSource, /assignmentId/);
  assert.match(graphQlSource, /membershipId/);
  assert.match(graphQlSource, /mutation UnassignProfile/);
  assert.match(actionSource, /unassignProfileAction/);
  assert.match(actionSource, /UnassignProfileDocument/);
  assert.match(actionSource, /await requireSession\(/);
});
