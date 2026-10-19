import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const accountFormPath = new URL('streaming-account-create-form.tsx', import.meta.url);
const assignmentFormPath = new URL('streaming-assignment-form.tsx', import.meta.url);

test('provides validated shadcn account creation and assignment forms', async () => {
  const [accountSource, assignmentSource] = await Promise.all([
    readFile(accountFormPath, 'utf8'),
    readFile(assignmentFormPath, 'utf8'),
  ]);

  assert.match(accountSource, /useForm<StreamingAccountFormValues>/);
  assert.match(accountSource, /zodResolver\(streamingAccountFormSchema\)/);
  assert.match(accountSource, /<Input/);
  assert.match(accountSource, /<Select/);
  assert.match(accountSource, /<Switch/);
  assert.doesNotMatch(accountSource, /<(input|select|button|label|textarea)\b/);

  assert.match(assignmentSource, /useForm<StreamingAssignmentFormValues>/);
  assert.match(assignmentSource, /zodResolver\(streamingAssignmentFormSchema\)/);
  assert.match(assignmentSource, /<Select/);
  assert.match(assignmentSource, /availableProfiles/);
  assert.doesNotMatch(assignmentSource, /<(input|select|button|label|textarea)\b/);
});
