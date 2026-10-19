import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  createQueryClient,
  getOperationErrorMessage,
} from '@/components/shared/providers/query-provider';

test('returns a safe fallback for unknown operation errors', () => {
  assert.equal(
    getOperationErrorMessage({ unexpected: true }),
    'The operation could not be completed. Please try again.'
  );
});

test('removes GraphQL transport details from operation errors', () => {
  const error = new Error(
    'Forbidden: {"response":{"errors":[{"message":"You do not have permission"}]}}'
  );

  assert.equal(getOperationErrorMessage(error), 'You do not have permission');
});

test('hides raw transport dumps that carry no human message', () => {
  const error = new Error(
    'GraphQL Error (Code: 500): {"response":{"status":500},"request":{"query":"mutation UploadMedia"}}'
  );

  assert.equal(
    getOperationErrorMessage(error),
    'The operation could not be completed. Please try again.'
  );
});

test('hides a bare internal server error message', () => {
  assert.equal(
    getOperationErrorMessage(new Error('Internal server error')),
    'The operation could not be completed. Please try again.'
  );
});

test('notifies failed mutations and refetches through the global query client', async () => {
  const messages: string[] = [];
  const client = createQueryClient((message) => messages.push(message));

  await assert.rejects(
    client
      .getMutationCache()
      .build(client, {
        mutationFn: async () => {
          throw new Error('Unable to save settings');
        },
      })
      .execute(null)
  );

  await assert.rejects(
    client.fetchQuery({
      queryKey: ['feedback-test'],
      queryFn: async () => {
        throw new Error('Unable to refresh data');
      },
      retry: false,
    })
  );

  assert.deepEqual(messages, ['Unable to save settings', 'Unable to refresh data']);
});
