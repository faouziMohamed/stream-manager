import { GraphQLError } from 'graphql';

import { requireAuth } from '@/server/features/common/guards/require-auth.guard';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

export function requireAdmin(
  context: GqlContext
): asserts context is GqlContext & { user: NonNullable<GqlContext['user']> } {
  requireAuth(context);

  if (context.user.role !== 'admin') {
    throw new GraphQLError('Forbidden', {
      extensions: {
        code: 'FORBIDDEN',
      },
    });
  }
}
