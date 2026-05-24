import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';

function setConsoleLayoutTestEnv() {
  process.env.DATABASE_URL ??= 'postgres://user:password@localhost:5432/stream_manager';
  process.env.BETTER_AUTH_SECRET ??= 'test-better-auth-secret';
  process.env.BETTER_AUTH_URL ??= 'http://localhost:3000';
  process.env.GITHUB_CLIENT_ID ??= 'test-github-client-id';
  process.env.GITHUB_CLIENT_SECRET ??= 'test-github-client-secret';
  process.env.DB_SSL_CA ??= 'test-db-ssl-ca';
  process.env.ENCRYPTION_KEY ??=
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  process.env.NEXT_PUBLIC_URL ??= 'http://localhost:3000';
}

test('console layout forces dynamic rendering so admin data is never prerendered', async () => {
  setConsoleLayoutTestEnv();

  const layout = await import('./layout');

  assert.equal(layout.dynamic, 'force-dynamic');
});
