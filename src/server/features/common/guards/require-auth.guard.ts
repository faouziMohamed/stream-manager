import { GraphQLError } from 'graphql';

import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

export function requireAuth(
  context: GqlContext
): asserts context is GqlContext & { user: NonNullable<GqlContext['user']> } {
  if (context.user === null) {
    throw new GraphQLError('Authentication required', {
      extensions: {
        code: 'UNAUTHENTICATED',
      },
    });
  }
}
