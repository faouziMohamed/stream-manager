'use client';

import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = '/api/graphql';

export const gqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  credentials: 'include',
});

export async function gqlRequest<T>(
  document: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  return gqlClient.request<T>(document, variables);
}
