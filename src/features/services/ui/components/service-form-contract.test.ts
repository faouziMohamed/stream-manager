import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';

const formPath = new URL('service-form.tsx', import.meta.url);
const consolePath = new URL('services-console.tsx', import.meta.url);

test('provides a validated shadcn service form and real create/edit controls', async () => {
  const [formSource, consoleSource] = await Promise.all([
    readFile(formPath, 'utf8'),
    readFile(consolePath, 'utf8'),
  ]);

  assert.match(formSource, /useForm<ServiceFormValues>/);
  assert.match(formSource, /zodResolver\(serviceFormSchema\)/);
  assert.match(formSource, /toServiceFormValues\(service\)/);
  assert.match(formSource, /form\.handleSubmit\(onSubmitAction, handleInvalid\)/);
  assert.match(formSource, /<Input/);
  assert.match(formSource, /<Select/);
  assert.match(formSource, /<Switch/);
  assert.doesNotMatch(formSource, /<(input|select|button|label|textarea)\b/);

  assert.match(consoleSource, /useCreateService/);
  assert.match(consoleSource, /useUpdateService/);
  assert.match(consoleSource, /<ServiceForm/);
  assert.match(consoleSource, /Edit service/);
  assert.match(consoleSource, /toast\.success/);
  assert.doesNotMatch(consoleSource, />\s*Import\s*</);
});
