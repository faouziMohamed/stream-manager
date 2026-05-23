import { auth } from '@/lib/auth/auth';
import { isAccountant, isAdmin } from '@/lib/auth/helpers';
import type { User } from '@/lib/db/tables/auth.table';
import { createLogger } from '@/lib/logger';

const logger = createLogger('graphql-context');

export interface GraphQLContext {
  user: User | null;
  isAdmin: boolean;
  isAccountant: boolean;
}

function createAnonymousGraphQLContext(): GraphQLContext {
  return { user: null, isAdmin: false, isAccountant: false };
}

export async function createGraphQLContext(request: Request): Promise<GraphQLContext> {
  const url = new URL(request.url);
  const logContext = {
    method: request.method,
    pathname: url.pathname,
  };

  logger.debug(logContext, 'Starting GraphQL context creation');

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user as User | null;
    const context = {
      user: user ?? null,
      isAdmin: isAdmin(user),
      isAccountant: isAccountant(user),
    };

    logger.debug(
      {
        ...logContext,
        authenticated: Boolean(user),
        userId: user?.id,
        isAdmin: context.isAdmin,
        isAccountant: context.isAccountant,
      },
      'Finished GraphQL context creation'
    );

    return context;
  } catch (error: unknown) {
    logger.error({ ...logContext, error }, 'GraphQL context creation failed');
    return createAnonymousGraphQLContext();
  }
}
