import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'vitest';

const featureDirectory = new URL('../..', import.meta.url);
const queryPath = new URL('use-services.queries.ts', import.meta.url);

test('provides explicit service form mapping and optimistic create/update mutations', async () => {
  const [featureFiles, querySource] = await Promise.all([
    readdir(featureDirectory),
    readFile(queryPath, 'utf8'),
  ]);

  assert.ok(featureFiles.includes('shared'));
  assert.match(querySource, /export function useCreateService/);
  assert.match(querySource, /export function useUpdateService/);
  assert.match(querySource, /onMutate:/);
  assert.match(querySource, /onError:/);
  assert.match(querySource, /onSettled:/);
});
