'use client';

import { createBrowserGraphQLClient } from '@/lib/graphql/client-config';

export const gqlClient = createBrowserGraphQLClient();

export async function gqlRequest<T>(
  document: string,
  variables?: Record<string, unknown>
): Promise<T> {
  return gqlClient.request<T>(document, variables);
}
