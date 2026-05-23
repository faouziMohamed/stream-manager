import assert from 'node:assert/strict';
import test from 'node:test';

import { runSequentially } from '@/lib/utils/promise-utils';

test('runSequentially executes async tasks one at a time in declaration order', async () => {
  let activeTaskCount = 0;
  let maxActiveTaskCount = 0;
  const events: string[] = [];

  function createTask(label: string, result: number) {
    return async function task() {
      events.push(`${label}:start`);
      activeTaskCount += 1;
      maxActiveTaskCount = Math.max(maxActiveTaskCount, activeTaskCount);

      await Promise.resolve();

      activeTaskCount -= 1;
      events.push(`${label}:end`);

      return result;
    };
  }

  const results = await runSequentially([
    createTask('subscriptions', 1),
    createTask('plans', 2),
    createTask('services', 3),
  ]);

  assert.deepEqual(results, [1, 2, 3]);
  assert.equal(maxActiveTaskCount, 1);
  assert.deepEqual(events, [
    'subscriptions:start',
    'subscriptions:end',
    'plans:start',
    'plans:end',
    'services:start',
    'services:end',
  ]);
});
