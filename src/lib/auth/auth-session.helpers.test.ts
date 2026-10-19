import assert from 'node:assert/strict';
import { test } from 'vitest';

import { hasSignedInSession, hasValidConsoleSession } from './auth-session.helpers';

test('hasSignedInSession rejects missing sessions and sessions without a session id', () => {
  assert.equal(hasSignedInSession(null), false);
  assert.equal(hasSignedInSession({ user: { id: 'usr_1', role: 'admin' } }), false);
  assert.equal(hasSignedInSession({ sessionId: 'ses_1', user: { role: 'admin' } }), false);
});

test('hasSignedInSession accepts a session carrying both a user id and a session id', () => {
  assert.equal(hasSignedInSession({ sessionId: 'ses_1', user: { id: 'usr_1' } }), true);
});

test('hasValidConsoleSession rejects sessions that are not signed in', () => {
  assert.equal(hasValidConsoleSession(null), false);
  assert.equal(hasValidConsoleSession({ user: { id: 'usr_1', role: 'admin' } }), false);
});

test('hasValidConsoleSession accepts allowed roles', () => {
  assert.equal(
    hasValidConsoleSession({ sessionId: 'ses_1', user: { id: 'usr_1', role: 'accountant' } }),
    true
  );
});

test('hasValidConsoleSession rejects roles without console access', () => {
  assert.equal(
    hasValidConsoleSession({ sessionId: 'ses_1', user: { id: 'usr_1', role: 'user' } }),
    false
  );
});
