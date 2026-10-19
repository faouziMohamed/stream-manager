import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import {
  getCustomerUseCase,
  getCustomersUseCase,
} from '@/server/features/customers/use-cases/get-customers.use-case';

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

describe('getCustomersUseCase', () => {
  it('rejects non-moderator users before reaching the repository layer', async () => {
    let findCustomersCalls = 0;

    await expect(
      getCustomersUseCase(
        {
          page: 1,
          pageSize: 20,
        },
        userContext,
        {
          findCustomers: async () => {
            findCustomersCalls += 1;
            return {
              items: [customerRecord],
              total: 1,
            };
          },
        }
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });

    expect(findCustomersCalls).toBe(0);
  });

  it('returns paginated customer DTOs for an accountant', async () => {
    const result = await getCustomersUseCase(
      {
        page: 1,
        pageSize: 20,
      },
      accountantContext,
      {
        findCustomers: async () => ({
          items: [customerRecord],
          total: 1,
        }),
      }
    );

    expect(result).toEqual({
      items: [
        {
          businessId: 'CST-0001',
          createdAt: '2026-01-01T00:00:00.000Z',
          email: 'alice@example.com',
          id: 'cst_test',
          isActive: true,
          language: 'fr',
          name: 'Alice',
          notesContent: null,
          phone: '+212600000000',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      pageInfo: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('returns an empty page when no customers exist', async () => {
    const result = await getCustomersUseCase(
      {
        page: 2,
        pageSize: 10,
      },
      adminContext,
      {
        findCustomers: async () => ({
          items: [],
          total: 0,
        }),
      }
    );

    expect(result).toEqual({
      items: [],
      pageInfo: {
        page: 2,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      },
    });
  });
});

describe('getCustomerUseCase', () => {
  it('rejects non-moderator users before reaching the repository layer', async () => {
    let findCustomerByIdCalls = 0;

    await expect(
      getCustomerUseCase('cst_test', userContext, {
        findCustomerById: async () => {
          findCustomerByIdCalls += 1;
          return customerRecord;
        },
      })
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });

    expect(findCustomerByIdCalls).toBe(0);
  });

  it('returns a customer DTO for an admin', async () => {
    const customer = await getCustomerUseCase('cst_test', adminContext, {
      findCustomerById: async () => customerRecord,
    });

    expect(customer).toEqual({
      businessId: 'CST-0001',
      createdAt: '2026-01-01T00:00:00.000Z',
      email: 'alice@example.com',
      id: 'cst_test',
      isActive: true,
      language: 'fr',
      name: 'Alice',
      notesContent: null,
      phone: '+212600000000',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('throws when the customer does not exist', async () => {
    await expect(
      getCustomerUseCase('cst_missing', accountantContext, {
        findCustomerById: async () => null,
      })
    ).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
      statusCode: 404,
    });
  });
});

const customerRecord = {
  businessId: 'CST-0001',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: 'alice@example.com',
  id: 'cst_test',
  isActive: true,
  language: 'fr',
  name: 'Alice',
  notesContent: null,
  phone: '+212600000000',
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
