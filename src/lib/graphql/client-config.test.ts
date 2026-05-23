import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';

test('resolveGraphQLEndpoint uses the current browser origin when available', async () => {
  const { resolveGraphQLEndpoint } = await loadClientConfig();

  const endpoint = resolveGraphQLEndpoint('https://preview.stream.mfaouzi.com');

  assert.equal(endpoint, 'https://preview.stream.mfaouzi.com/api/graphql');
});

test('resolveGraphQLEndpoint falls back to configured base URL when browser origin is unavailable', async () => {
  const { resolveGraphQLEndpoint } = await loadClientConfig();

  const endpoint = resolveGraphQLEndpoint(undefined, 'https://stream.mfaouzi.com/');

  assert.equal(endpoint, 'https://stream.mfaouzi.com/api/graphql');
});

test('GraphQL client request config keeps credentials included', async () => {
  const { GRAPHQL_CLIENT_REQUEST_CONFIG } = await loadClientConfig();

  assert.deepEqual(GRAPHQL_CLIENT_REQUEST_CONFIG, { credentials: 'include' });
});

async function loadClientConfig() {
  process.env.DATABASE_URL ??= 'postgres://user:password@localhost:5432/stream_manager';
  process.env.BETTER_AUTH_SECRET ??= 'test-better-auth-secret';
  process.env.BETTER_AUTH_URL ??= 'http://localhost:3000';
  process.env.GITHUB_CLIENT_ID ??= 'test-github-client-id';
  process.env.GITHUB_CLIENT_SECRET ??= 'test-github-client-secret';
  process.env.DB_SSL_CA ??= 'test-db-ssl-ca';
  process.env.ENCRYPTION_KEY ??=
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  process.env.NEXT_PUBLIC_URL ??= 'http://localhost:3000';

  return import('@/lib/graphql/client-config');
}



