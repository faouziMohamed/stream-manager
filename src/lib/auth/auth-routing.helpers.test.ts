import assert from 'node:assert/strict';
import { test } from 'vitest';

import { ROUTES } from '@/lib/config/routes';

import { buildLoginRedirectPath, resolveSafeCallbackPath } from './auth-routing.helpers';

test('buildLoginRedirectPath preserves the interrupted console path and query', () => {
  assert.equal(
    buildLoginRedirectPath('/console/customers?status=active'),
    `${ROUTES.auth.login}?next=%2Fconsole%2Fcustomers%3Fstatus%3Dactive`
  );
});

test('resolveSafeCallbackPath accepts internal console paths', () => {
  assert.equal(resolveSafeCallbackPath('/console/payments?page=2'), '/console/payments?page=2');
});

test('resolveSafeCallbackPath rejects external and non-console redirects', () => {
  assert.equal(resolveSafeCallbackPath('https://evil.example/console'), ROUTES.console.root);
  assert.equal(resolveSafeCallbackPath('//evil.example/console'), ROUTES.console.root);
  assert.equal(resolveSafeCallbackPath('/contact'), ROUTES.console.root);
});
