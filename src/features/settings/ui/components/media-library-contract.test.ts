import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

const librarySource = readFileSync(new URL('media-library.tsx', import.meta.url), 'utf8');
const uploaderSource = readFileSync(new URL('media-uploader.tsx', import.meta.url), 'utf8');
const combined = librarySource + uploaderSource;

test('media library uses premium shadcn interactions with explicit feedback', () => {
  assert.match(librarySource, /useMediaAssets/);
  assert.match(librarySource, /AlertDialog/);
  assert.match(librarySource, /toast\.success/);
  assert.match(uploaderSource, /<Input/);
  assert.match(uploaderSource, /<Button/);
  assert.doesNotMatch(combined, /<button\b/);
  assert.doesNotMatch(combined, /<input\b/);
  assert.doesNotMatch(combined, /window\.confirm/);
});
