import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const formPath = new URL('streaming-assignment-form.tsx', import.meta.url);

// Assigning a profile requires an active membership to attach it to. With no
// memberships the form must show the PrerequisiteOverlay (like the membership
// and plan create forms do) instead of empty select options.
test('assignment form gates on the membership prerequisite', async () => {
  const source = await readFile(formPath, 'utf8');

  assert.match(source, /PrerequisiteOverlay/);
  assert.match(source, /membershipOptions\.length === 0/);
  assert.match(source, /ROUTES\.console\.memberships/);
});
