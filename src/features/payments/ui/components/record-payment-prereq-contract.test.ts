import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const formPath = new URL('record-payment-form.tsx', import.meta.url);

// A payment must reference a membership. With no memberships the form must
// show the PrerequisiteOverlay (standard pattern across create forms)
// instead of letting the user fill a form that cannot be submitted.
test('record payment form gates on the membership prerequisite', async () => {
  const source = await readFile(formPath, 'utf8');

  assert.match(source, /PrerequisiteOverlay/);
  assert.match(source, /membershipOptions\.length === 0/);
  assert.match(source, /ROUTES\.console\.memberships/);
});
