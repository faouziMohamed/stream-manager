import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const graphqlPath = new URL('../graphql/memberships.graphql', import.meta.url);
const loaderPath = new URL('memberships.loader.ts', import.meta.url);

test('composes membership rows, customers, and plans in the BFF loader', async () => {
  const [graphqlSource, loaderSource] = await Promise.all([
    readFile(graphqlPath, 'utf8'),
    readFile(loaderPath, 'utf8'),
  ]);

  assert.match(graphqlSource, /query ListMembershipCustomerOptions/);
  assert.match(graphqlSource, /query ListMembershipPlanOptions/);
  assert.match(loaderSource, /customers: customers\.items/);
  assert.match(loaderSource, /plans: plans\.items/);
  assert.match(loaderSource, /Promise\.all/);
});

test('ships the whole catalog, so rows can label archived and retired records', async () => {
  const loaderSource = await readFile(loaderPath, 'utf8');

  // Filtering here is what made archived customers render as a placeholder:
  // the console derives its pickers from this payload instead.
  assert.doesNotMatch(loaderSource, /customers\.items\.filter/);
  assert.doesNotMatch(loaderSource, /plans\.items\.filter/);
  assert.match(loaderSource, /ListMembershipPlanOptionsDocument, { isActive: null/);
});
