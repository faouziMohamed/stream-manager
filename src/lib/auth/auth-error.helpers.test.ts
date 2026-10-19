import assert from 'node:assert/strict';
import { test } from 'vitest';

import { isAuthRecoveryFailure, isExpiredTokenError } from './auth-error.helpers';

test('isExpiredTokenError recognizes GraphQL TOKEN_EXPIRED extension codes', () => {
  assert.equal(
    isExpiredTokenError({
      response: {
        errors: [
          {
            message: 'Access token expired',
            extensions: {
              code: 'TOKEN_EXPIRED',
            },
          },
        ],
      },
    }),
    true
  );
});

test('isAuthRecoveryFailure recognizes token-expired and unauthenticated errors', () => {
  assert.equal(
    isAuthRecoveryFailure({
      response: {
        errors: [
          {
            extensions: {
              code: 'UNAUTHENTICATED',
            },
          },
        ],
      },
    }),
    true
  );
  assert.equal(
    isAuthRecoveryFailure({
      response: {
        errors: [
          {
            extensions: {
              code: 'FORBIDDEN',
            },
          },
        ],
      },
    }),
    false
  );
});
