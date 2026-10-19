import { GraphQLError } from 'graphql';

import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
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

describe('requireAdmin', () => {
  it('passes for admin users', () => {
    expect(() => requireAdmin(adminContext)).not.toThrow();
  });

  it('throws FORBIDDEN for user role', () => {
    expect(() => requireAdmin(userContext)).toThrow(GraphQLError);
    expect(() => requireAdmin(userContext)).toThrow('Forbidden');
  });

  it('throws FORBIDDEN for accountant role', () => {
    expect(() => requireAdmin(accountantContext)).toThrow(GraphQLError);
    expect(() => requireAdmin(accountantContext)).toThrow('Forbidden');
  });

  it('throws UNAUTHENTICATED for unauthenticated users', () => {
    expect(() => requireAdmin(unauthenticatedContext)).toThrow(GraphQLError);
    expect(() => requireAdmin(unauthenticatedContext)).toThrow('Authentication required');
  });

  it('throws UNAUTHENTICATED when user is null', () => {
    expect(() => requireAdmin(unauthenticatedContext)).toThrow(GraphQLError);
    expect(() => requireAdmin(unauthenticatedContext)).toThrow('Authentication required');
  });
});
