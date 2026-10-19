import 'server-only';

import { makeExecutableSchema } from '@graphql-tools/schema';
import { createYoga } from 'graphql-yoga';

import { createYogaConfig } from '@/server/config/yoga.config';
import { createGraphQLContext } from '@/server/lib/graphql/context';
import { schemaResolvers } from '@/server/lib/graphql/resolvers';
import { schemaTypeDefs } from '@/server/lib/graphql/schema';

export const GRAPHQL_ENDPOINT = '/api/graphql';

export const schema = makeExecutableSchema({
  resolvers: schemaResolvers,
  typeDefs: schemaTypeDefs,
});

// Single Yoga instance shared by the route handler and by server-side callers.
// Server code invokes `yoga.fetch` directly instead of opening a socket back to
// this same process — an RSC or Server Action making a real HTTP request to its
// own server can stall during build/prerender.
export const yoga = createYoga({
  ...createYogaConfig(schema, createGraphQLContext),
  fetchAPI: { Response },
  graphqlEndpoint: GRAPHQL_ENDPOINT,
});
