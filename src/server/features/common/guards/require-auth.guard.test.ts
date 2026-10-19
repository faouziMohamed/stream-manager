import { GraphQLError } from 'graphql';

import { requireAuth } from '@/server/features/common/guards/require-auth.guard';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

const authenticatedContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_admin',
  user: {
    avatar: null,
    email: 'admin@example.com',
    id: 'usr_admin',
    name: 'Admin',
    role: 'admin',
  },
};

const unauthenticatedContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: null,
  user: null,
};

describe('requireAuth', () => {
  it('passes for authenticated users', () => {
    expect(() => requireAuth(authenticatedContext)).not.toThrow();
  });

  it('throws UNAUTHENTICATED when user is null', () => {
    expect(() => requireAuth(unauthenticatedContext)).toThrow(GraphQLError);
    expect(() => requireAuth(unauthenticatedContext)).toThrow('Authentication required');
  });
});
