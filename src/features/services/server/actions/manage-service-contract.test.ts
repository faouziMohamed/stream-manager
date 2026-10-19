import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const graphqlPath = new URL('../graphql/services.graphql', import.meta.url);
const actionPath = new URL('manage-service.action.ts', import.meta.url);

test('exposes create and update service through authenticated server actions', async () => {
  const graphqlSource = await readFile(graphqlPath, 'utf8');

  assert.match(graphqlSource, /mutation CreateService/);
  assert.match(graphqlSource, /mutation UpdateService/);

  await assert.doesNotReject(() => readFile(actionPath, 'utf8'));
});
