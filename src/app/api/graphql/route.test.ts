import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';

function setGraphQLRouteTestEnv() {
  process.env.DATABASE_URL ??= 'postgres://user:password@localhost:5432/stream_manager';
  process.env.BETTER_AUTH_SECRET ??= 'test-better-auth-secret';
  process.env.BETTER_AUTH_URL ??= 'http://localhost:3000';
  process.env.GITHUB_CLIENT_ID ??= 'test-github-client-id';
  process.env.GITHUB_CLIENT_SECRET ??= 'test-github-client-secret';
  process.env.DB_SSL_CA ??= 'test-db-ssl-ca';
  process.env.ENCRYPTION_KEY ??= '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  process.env.NEXT_PUBLIC_URL ??= 'http://localhost:3000';
}

test('GraphQL route exports callable handlers that return a response', async () => {
  setGraphQLRouteTestEnv();

  const route = await import('./route');

  assert.equal(typeof route.GET, 'function');
  assert.equal(typeof route.POST, 'function');

  const response = await route.POST(
    new Request('http://localhost/api/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: '{ __typename }' }),
    })
  );

  assert.ok(response instanceof Response);
  assert.equal(response.status, 200);

  const payload = (await response.json()) as { data?: { __typename?: string } };

  assert.equal(payload.data?.__typename, 'Query');
});
