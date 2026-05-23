import { GraphQLClient } from 'graphql-request';
import { env } from '@/lib/settings/env';

export const GRAPHQL_ENDPOINT_PATH = '/api/graphql';
export const GRAPHQL_CLIENT_REQUEST_CONFIG = {
  credentials: 'include' as const,
};

export function resolveGraphQLEndpoint(
  currentOrigin = typeof window === 'undefined' ? undefined : window.location.origin,
  fallbackBaseUrl = env.NEXT_PUBLIC_URL
) {
  const baseUrl = (currentOrigin ?? fallbackBaseUrl).replace(/\/+$/, '');

  return `${baseUrl}${GRAPHQL_ENDPOINT_PATH}`;
}

export function createBrowserGraphQLClient() {
  return new GraphQLClient(resolveGraphQLEndpoint(), GRAPHQL_CLIENT_REQUEST_CONFIG);
}

