import type { GraphQLSchema } from 'graphql';
import type { YogaInitialContext } from 'graphql-yoga';

import { env } from '@/server/config/env';
import { maskGraphqlError } from '@/server/common/errors/graphql-error';
import { createLogger } from '@/server/config/logger.config';
import { createAuditLogPlugin } from '@/server/config/graphql-audit.plugin';
import { createGraphqlLoggingPlugin } from '@/server/config/graphql-logging.plugin';

const yogaLogger = createLogger('graphql');

const yogaPinoLogger = {
  debug: (message: unknown) => yogaLogger.debug({ raw: message }, 'graphql'),
  info: (message: unknown) => yogaLogger.info({ raw: message }, 'graphql'),
  warn: (message: unknown) => yogaLogger.warn({ raw: message }, 'graphql'),
  error: (message: unknown) => {
    if (message instanceof Error) {
      yogaLogger.error({ err: message }, message.message);
    } else {
      yogaLogger.error({ raw: message }, 'graphql error');
    }
  },
};

export function createYogaConfig<TContext extends object>(
  schema: GraphQLSchema,
  context: YogaContextFactory<TContext>
) {
  return {
    context,
    graphiql: env.NODE_ENV !== 'production',
    logging: yogaPinoLogger,
    maskedErrors: {
      errorMessage: 'Internal server error',
      isDev: env.NODE_ENV !== 'production',
      maskError: maskGraphqlError,
    },
    plugins: [createGraphqlLoggingPlugin(), createAuditLogPlugin()],
    schema,
  };
}

type YogaContextFactory<TContext extends object> = (
  initialContext: YogaInitialContext
) => Promise<TContext> | TContext;
