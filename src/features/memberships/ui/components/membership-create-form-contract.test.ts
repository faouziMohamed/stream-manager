import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'vitest';

const componentsDirectory = new URL('.', import.meta.url);
const consolePath = new URL('memberships-console.tsx', import.meta.url);

test('connects a library-backed validated create form to the memberships console', async () => {
  const [componentFiles, consoleSource] = await Promise.all([
    readdir(componentsDirectory),
    readFile(consolePath, 'utf8'),
  ]);

  assert.ok(componentFiles.includes('membership-create-form.tsx'));
  assert.match(consoleSource, /<MembershipCreateForm/);
  assert.match(consoleSource, /useCreateMembership/);
});
