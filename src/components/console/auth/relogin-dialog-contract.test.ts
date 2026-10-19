import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const dialogPath = new URL('relogin-dialog.tsx', import.meta.url);

test('relogin dialog uses shadcn form primitives and inline credential errors', async () => {
  const source = await readFile(dialogPath, 'utf8');

  assert.match(source, /Dialog/);
  assert.match(source, /Input/);
  assert.match(source, /Button/);
  assert.match(source, /Label/);
  assert.match(source, /useForm/);
  assert.match(source, /zodResolver/);
  assert.match(source, /signIn\(["']credentials["']/);
  assert.match(source, /redirect:\s*false/);
  assert.match(source, /text-destructive/);
  assert.doesNotMatch(source, /router\.push|router\.replace|window\.location/);
});
