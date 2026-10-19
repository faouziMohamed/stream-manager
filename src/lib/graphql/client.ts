import 'server-only';

import { print } from 'graphql';
import type { DocumentNode } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

import { createLogger } from '@/lib/logger';
import { GRAPHQL_ENDPOINT, yoga } from '@/server/lib/graphql/yoga';

const log = createLogger('graphql.client');

/**
 * Runs a GraphQL operation against the schema hosted by this same app.
 *
 * The request goes straight through the Yoga pipeline (context, plugins, error
 * masking) without a network hop. Opening a real socket back to our own server
 * from an RSC or Server Action can stall during build and prerender, so we
 * never do that. `/api/graphql` stays available for external clients.
 */
export async function gqlRequest<
  TData,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(
  document: string | DocumentNode | TypedDocumentNode<TData, TVariables>,
  variables?: TVariables
): Promise<TData> {
  const query = typeof document === 'string' ? document : print(document);

  const response = await yoga.fetch(`http://localhost${GRAPHQL_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/graphql-response+json, application/json',
    },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors !== undefined && payload.errors.length > 0) {
    const message = payload.errors.map((error) => error.message).join('; ');
    log.error(
      { errors: payload.errors, operation: operationNameOf(document) },
      'GraphQL request failed'
    );
    throw new GraphQLRequestError(message, payload.errors);
  }

  if (payload.data === undefined || payload.data === null) {
    throw new GraphQLRequestError('GraphQL response contained no data', []);
  }

  return payload.data;
}

export class GraphQLRequestError extends Error {
  readonly errors: GraphQLResponseError[];

  constructor(message: string, errors: GraphQLResponseError[]) {
    super(message);
    this.name = 'GraphQLRequestError';
    this.errors = errors;
  }
}

export type GraphQLResponseError = {
  message: string;
  extensions?: Record<string, unknown>;
};

type GraphQLResponse<TData> = {
  data?: TData | null;
  errors?: GraphQLResponseError[];
};

function operationNameOf(document: string | DocumentNode): string {
  if (typeof document === 'string') {
    return /\b(?:query|mutation|subscription)\s+(\w+)/.exec(document)?.[1] ?? 'anonymous';
  }

  for (const definition of document.definitions) {
    if (definition.kind === 'OperationDefinition' && definition.name !== undefined) {
      return definition.name.value;
    }
  }

  return 'anonymous';
}
