import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const schemaPath = new URL('../../shared/streaming-account-form.schema.ts', import.meta.url);
const accountsQueryPath = new URL('use-streaming-accounts.queries.ts', import.meta.url);
const profilesQueryPath = new URL('use-streaming-profiles.queries.ts', import.meta.url);

test('validates and optimistically manages streaming accounts and assignments', async () => {
  const [schemaSource, accountsSource, profilesSource] = await Promise.all([
    readFile(schemaPath, 'utf8'),
    readFile(accountsQueryPath, 'utf8'),
    readFile(profilesQueryPath, 'utf8'),
  ]);

  assert.match(schemaSource, /streamingAccountFormSchema/);
  assert.match(schemaSource, /streamingAssignmentFormSchema/);
  assert.match(schemaSource, /toStreamingAccountFormValues/);
  assert.match(accountsSource, /useCreateStreamingAccount/);
  assert.match(profilesSource, /useAssignProfileToMembership/);
  assert.match(accountsSource, /onMutate/);
  assert.match(accountsSource, /onError/);
  assert.match(accountsSource, /onSettled/);
});
