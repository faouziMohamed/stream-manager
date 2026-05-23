import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';
import { createGraphQLContext } from '@/lib/graphql/context';
import { createLogger } from '@/lib/logger';
import { env } from '@/lib/settings/env';

const logger = createLogger('graphql-route');
const schema = makeExecutableSchema({ typeDefs, resolvers });

const yoga = createYoga({
  schema,
  logging: 'debug',
  landingPage: true,
  graphqlEndpoint: '/api/graphql',
  graphiql: env.NODE_ENV === 'development',
  context: ({ request }) => createGraphQLContext(request),
});

type GraphQLRouteContext = {
  params?: Promise<Record<string, string | string[] | undefined>>;
};

type ResponseLike = {
  body: ReadableStream<Uint8Array> | null;
  headers: Headers;
  status: number;
  statusText: string;
};

function toNativeResponse(response: Response | ResponseLike): Response {
  if (response instanceof Response) {
    return response;
  }

  return new Response(response.body, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
}

function createRequestLogContext(request: Request, requestId: string) {
  const url = new URL(request.url);

  return {
    requestId,
    method: request.method,
    pathname: url.pathname,
  };
}

async function handleGraphQLRoute(request: Request, routeContext?: GraphQLRouteContext) {
  const requestId = crypto.randomUUID();
  const logContext = createRequestLogContext(request, requestId);

  logger.debug(logContext, 'Received GraphQL route request');

  try {
    logger.debug(logContext, 'Dispatching GraphQL request to Yoga');

    const response = await yoga.fetch(request);
    const nativeResponse = toNativeResponse(response);

    logger.info(
      { ...logContext, hasRouteContext: Boolean(routeContext), status: nativeResponse.status },
      'Completed GraphQL route request'
    );

    return nativeResponse;
  } catch (error: unknown) {
    logger.error({ ...logContext, error }, 'GraphQL route request failed');
    throw error;
  }
}

export async function GET(request: Request, routeContext?: GraphQLRouteContext) {
  return handleGraphQLRoute(request, routeContext);
}

export async function POST(request: Request, routeContext?: GraphQLRouteContext) {
  return handleGraphQLRoute(request, routeContext);
}
