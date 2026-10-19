import { GraphQLError } from 'graphql';

import { requireModerator } from '@/server/features/common/guards/require-moderator.guard';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

const adminContext: GqlContext = {
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

const userContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: 'ses_user',
  user: {
    avatar: null,
    email: 'user@example.com',
    id: 'usr_user',
    name: 'User',
    role: 'user',
  },
};

const accountantContext: GqlContext = {
  isAccountant: true,
  isAdmin: false,
  sessionId: 'ses_accountant',
  user: {
    avatar: null,
    email: 'accountant@example.com',
    id: 'usr_accountant',
    name: 'Accountant',
    role: 'accountant',
  },
};

const unauthenticatedContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: null,
  user: null,
};

describe('requireModerator', () => {
  it('passes for admin users', () => {
    expect(() => requireModerator(adminContext)).not.toThrow();
  });

  it('passes for accountant users', () => {
    expect(() => requireModerator(accountantContext)).not.toThrow();
  });

  it('throws FORBIDDEN for user role', () => {
    expect(() => requireModerator(userContext)).toThrow(GraphQLError);
    expect(() => requireModerator(userContext)).toThrow('Forbidden');
  });

  it('throws UNAUTHENTICATED for unauthenticated users', () => {
    expect(() => requireModerator(unauthenticatedContext)).toThrow(GraphQLError);
    expect(() => requireModerator(unauthenticatedContext)).toThrow('Authentication required');
  });
});
