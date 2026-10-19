import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { plansResolvers } from '@/server/features/plans/resolvers/plans.resolvers';
import { plansTypeDefs } from '@/server/features/plans/schemas/graphql/plans.schema';

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

describe('plans GraphQL surface', () => {
  it('exposes createPlan in the schema', () => {
    expect(plansTypeDefs).toContain('createPlan(input: CreatePlanInput!): Plan!');
  });

  it('exposes plan read queries in the schema', () => {
    expect(plansTypeDefs).toContain('plan(id: ID!): Plan');
    expect(plansTypeDefs).toContain('plans(');
    expect(plansTypeDefs).toContain('serviceId: ID');
    expect(plansTypeDefs).toContain('planType: String');
    expect(plansTypeDefs).toContain('isActive: Boolean');
  });

  it('rejects invalid plan query id before the use case layer', async () => {
    await expect(
      plansResolvers.Query.plan(
        undefined,
        {
          id: 'invalid-id',
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects invalid createPlan input before the use case layer', async () => {
    await expect(
      plansResolvers.Mutation.createPlan(
        undefined,
        {
          input: {
            durationMonths: 1,
            name: 'Netflix Standard',
            price: '99.99',
          },
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects createPlan for non-admin users', async () => {
    await expect(
      plansResolvers.Mutation.createPlan(
        undefined,
        {
          input: {
            durationMonths: 1,
            name: 'Netflix Standard',
            price: '99.99',
            serviceId: 'svc_test',
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

  it('exposes updatePlan and deletePlan in the schema', () => {
    expect(plansTypeDefs).toContain('updatePlan(input: UpdatePlanInput!): Plan!');
    expect(plansTypeDefs).toContain('deletePlan(input: DeletePlanInput!): Plan!');
  });

  it('rejects invalid updatePlan input before the use case layer', async () => {
    await expect(
      plansResolvers.Mutation.updatePlan(
        undefined,
        {
          input: {
            id: 'invalid-id',
            serviceId: 'svc_test',
          },
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects deletePlan for non-admin users', async () => {
    await expect(
      plansResolvers.Mutation.deletePlan(
        undefined,
        {
          input: {
            id: 'pln_test',
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
});
