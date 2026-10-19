import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

const loaderSource = readFileSync(new URL('media-assets.loader.ts', import.meta.url), 'utf8');
const actionSource = readFileSync(
  new URL('../actions/media-assets.action.ts', import.meta.url),
  'utf8'
);

test('media assets stay behind authenticated server GraphQL transport', () => {
  assert.match(loaderSource, /MediaAssetsDocument/);
  assert.match(loaderSource, /auth\(\)/);
  assert.match(loaderSource, /gqlRequest/);
  assert.match(actionSource, /DeleteMediaAssetDocument/);
  assert.match(actionSource, /loadMediaAssets/);
  assert.doesNotMatch(loaderSource + actionSource, /fetch\(/);
});
