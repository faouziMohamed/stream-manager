import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { paymentsResolvers } from '@/server/features/payments/resolvers/payments.resolvers';
import { paymentsTypeDefs } from '@/server/features/payments/schemas/graphql/payments.schema';

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

describe('payments GraphQL surface', () => {
  it('exposes markPaymentPaid mutation in the schema', () => {
    expect(paymentsTypeDefs).toContain('markPaymentPaid(input: MarkPaymentPaidInput!): Payment!');
  });

  it('exposes payment read queries in the schema', () => {
    expect(paymentsTypeDefs).toContain('payment(id: ID!): Payment');
    expect(paymentsTypeDefs).toContain('payments(');
    expect(paymentsTypeDefs).toContain('customerId: ID');
    expect(paymentsTypeDefs).toContain('membershipId: ID');
    expect(paymentsTypeDefs).toContain('status: String');
    expect(paymentsTypeDefs).toContain('dueFrom: String');
    expect(paymentsTypeDefs).toContain('dueTo: String');
  });

  it('rejects invalid payment query id before the use case layer', async () => {
    await expect(
      paymentsResolvers.Query.payment(
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

  it('rejects invalid markPaymentPaid input before the use case layer', async () => {
    await expect(
      paymentsResolvers.Mutation.markPaymentPaid(
        undefined,
        {
          input: {
            id: '',
          },
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects markPaymentPaid for non-admin users', async () => {
    await expect(
      paymentsResolvers.Mutation.markPaymentPaid(
        undefined,
        {
          input: {
            id: 'pay_test',
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
