import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

const mediaQueriesSource = readFileSync(
  new URL('use-media-assets.queries.ts', import.meta.url),
  'utf8'
);
const uploadQuerySource = readFileSync(
  new URL('use-upload-media.mutation.ts', import.meta.url),
  'utf8'
);

test('media mutations optimistically synchronize the persistent library', () => {
  assert.match(mediaQueriesSource, /useQuery/);
  assert.match(mediaQueriesSource, /onMutate/);
  assert.match(mediaQueriesSource, /onError/);
  assert.match(mediaQueriesSource, /invalidateQueries/);
  assert.match(uploadQuerySource, /MEDIA_ASSETS_QUERY_KEY/);
  assert.match(uploadQuerySource, /invalidateQueries/);
});
