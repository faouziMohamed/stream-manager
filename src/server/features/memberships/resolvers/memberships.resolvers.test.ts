import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { membershipsResolvers } from '@/server/features/memberships/resolvers/memberships.resolvers';
import { membershipsTypeDefs } from '@/server/features/memberships/schemas/graphql/memberships.schema';

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

describe('memberships GraphQL surface', () => {
  it('exposes the membership mutations in the schema', () => {
    expect(membershipsTypeDefs).toContain(
      'createMembership(input: CreateMembershipInput!): Membership!'
    );
    expect(membershipsTypeDefs).toContain(
      'renewMembership(input: RenewMembershipInput!): Membership!'
    );
    expect(membershipsTypeDefs).toContain(
      'cancelMembership(input: CancelMembershipInput!): Membership!'
    );
  });

  it('exposes the membership queries in the schema', () => {
    expect(membershipsTypeDefs).toContain('membership(id: ID!): Membership');
    expect(membershipsTypeDefs).toContain('memberships(');
  });

  it('rejects invalid createMembership input before the use case layer', async () => {
    await expect(
      membershipsResolvers.Mutation.createMembership(
        undefined,
        {
          input: {
            customerId: '',
            planId: 'pln_test',
            startDate: '2026-01-15',
          },
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects createMembership for non-admin users', async () => {
    await expect(
      membershipsResolvers.Mutation.createMembership(
        undefined,
        {
          input: {
            customerId: 'cst_test',
            planId: 'pln_test',
            startDate: '2026-01-15',
          },
        },
        userContext
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });
  });

  it('rejects invalid renewMembership input before the use case layer', async () => {
    await expect(
      membershipsResolvers.Mutation.renewMembership(
        undefined,
        {
          input: {},
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects renewMembership for non-admin users', async () => {
    await expect(
      membershipsResolvers.Mutation.renewMembership(
        undefined,
        {
          input: {
            id: 'mbr_test',
          },
        },
        userContext
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });
  });

  it('rejects invalid cancelMembership input before the use case layer', async () => {
    await expect(
      membershipsResolvers.Mutation.cancelMembership(
        undefined,
        {
          input: {
            id: 'mbr_test',
          },
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects cancelMembership for non-admin users', async () => {
    await expect(
      membershipsResolvers.Mutation.cancelMembership(
        undefined,
        {
          input: {
            confirmed: true,
            id: 'mbr_test',
          },
        },
        userContext
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });
  });

  it('rejects membership(id) for non-moderator users', async () => {
    await expect(
      membershipsResolvers.Query.membership(
        undefined,
        {
          id: 'mbr_test',
        },
        userContext
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });
  });

  it('rejects memberships for non-moderator users', async () => {
    await expect(
      membershipsResolvers.Query.memberships(undefined, {}, userContext)
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });
  });

  it('allows accountant users past authorization on memberships(...)', async () => {
    await expect(
      membershipsResolvers.Query.memberships(
        undefined,
        {
          page: 0,
          pageSize: 20,
        },
        accountantContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });
});
