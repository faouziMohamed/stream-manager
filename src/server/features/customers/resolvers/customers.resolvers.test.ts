import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { customersResolvers } from '@/server/features/customers/resolvers/customers.resolvers';
import { customersTypeDefs } from '@/server/features/customers/schemas/graphql/customers.schema';

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

describe('customers GraphQL surface', () => {
  it('exposes createCustomer in the schema', () => {
    expect(customersTypeDefs).toContain('createCustomer(input: CreateCustomerInput!): Customer!');
    expect(customersTypeDefs).toContain('archiveCustomer(id: ID!): Customer!');
    expect(customersTypeDefs).toContain('updateCustomer(input: UpdateCustomerInput!): Customer!');
    expect(customersTypeDefs).toContain('customer(id: ID!): Customer');
    expect(customersTypeDefs).toContain(
      'customers(page: Int = 1, pageSize: Int = 20): CustomerConnection!'
    );
  });

  it('rejects invalid createCustomer input before the use case layer', async () => {
    await expect(
      customersResolvers.Mutation.createCustomer(
        undefined,
        {
          input: {
            name: '   ',
          },
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects createCustomer for non-admin users', async () => {
    await expect(
      customersResolvers.Mutation.createCustomer(
        undefined,
        {
          input: {
            name: 'Alice',
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

  it('rejects invalid updateCustomer input before the use case layer', async () => {
    await expect(
      customersResolvers.Mutation.updateCustomer(
        undefined,
        {
          input: {
            id: 'cst_test',
          },
        },
        adminContext
      )
    ).rejects.toMatchObject({
      code: 'BAD_USER_INPUT',
      statusCode: 400,
    });
  });

  it('rejects updateCustomer for non-admin users', async () => {
    await expect(
      customersResolvers.Mutation.updateCustomer(
        undefined,
        {
          input: {
            id: 'cst_test',
            name: 'Alice Updated',
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

  it('rejects archiveCustomer for non-admin users', async () => {
    await expect(
      customersResolvers.Mutation.archiveCustomer(
        undefined,
        {
          id: 'cst_test',
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

  it('rejects customer(id) for non-moderator users', async () => {
    await expect(
      customersResolvers.Query.customer(
        undefined,
        {
          id: 'cst_test',
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

  it('allows accountant users past authorization on customers(...)', async () => {
    await expect(
      customersResolvers.Query.customers(
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
