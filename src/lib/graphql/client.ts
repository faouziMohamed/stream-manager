'use client';

import {GraphQLClient} from 'graphql-request';
import {env} from '@/lib/settings/env';

const GRAPHQL_ENDPOINT = `${env.NEXT_PUBLIC_URL}/api/graphql`;

export const gqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
    credentials: 'include',
});

export async function gqlRequest<T>(
    document: string,
    variables?: Record<string, unknown>,
): Promise<T> {
    return gqlClient.request<T>(document, variables);
}
