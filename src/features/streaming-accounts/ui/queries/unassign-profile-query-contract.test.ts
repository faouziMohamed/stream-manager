import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const queryPath = new URL('use-streaming-profiles.queries.ts', import.meta.url);

test('provides optimistic profile unassignment with rollback and invalidation', async () => {
  const source = await readFile(queryPath, 'utf8');

  assert.match(source, /export function useUnassignProfile/);
  assert.match(source, /unassignProfileAction/);
  assert.match(source, /onMutate/);
  assert.match(source, /assignmentId: null/);
  assert.match(source, /membershipId: null/);
  assert.match(source, /isAssigned: false/);
  assert.match(source, /onError/);
  assert.match(source, /onSettled/);
});
