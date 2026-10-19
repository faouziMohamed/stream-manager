import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { createCustomerUseCase } from '@/server/features/customers/use-cases/create-customer.use-case';

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

describe('createCustomerUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findLatestCustomerBusinessIdCalls = 0;
    let insertCustomerCalls = 0;

    await expect(
      createCustomerUseCase(
        {
          name: 'Alice',
        },
        userContext,
        {
          createId: () => 'cst_test',
          findLatestCustomerBusinessId: async () => {
            findLatestCustomerBusinessIdCalls += 1;
            return null;
          },
          insertCustomer: async () => {
            insertCustomerCalls += 1;
            return customerRecord;
          },
        }
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });

    expect(findLatestCustomerBusinessIdCalls).toBe(0);
    expect(insertCustomerCalls).toBe(0);
  });

  it('creates the first customer business id when none exist', async () => {
    const customer = await createCustomerUseCase(
      {
        name: 'Alice',
      },
      adminContext,
      {
        createId: () => 'cst_test',
        findLatestCustomerBusinessId: async () => null,
        insertCustomer: async (input) => ({
          ...customerRecord,
          ...input,
          businessId: input.businessId,
          id: input.id,
          name: input.name,
        }),
      }
    );

    expect(customer.id).toBe('cst_test');
    expect(customer.businessId).toBe('CST-0001');
    expect(customer.name).toBe('Alice');
  });

  it('increments the latest customer business id', async () => {
    const customer = await createCustomerUseCase(
      {
        email: 'alice@example.com',
        name: 'Alice',
        notesContent: null,
        phone: null,
      },
      adminContext,
      {
        createId: () => 'cst_test',
        findLatestCustomerBusinessId: async () => 'CST-0042',
        insertCustomer: async (input) => ({
          ...customerRecord,
          ...input,
          businessId: input.businessId,
          email: input.email ?? null,
          id: input.id,
          name: input.name,
          notesContent: input.notesContent ?? null,
          phone: input.phone ?? null,
        }),
      }
    );

    expect(customer.businessId).toBe('CST-0043');
    expect(customer.email).toBe('alice@example.com');
    expect(customer.notesContent).toBeNull();
    expect(customer.phone).toBeNull();
  });

  it('rejects when the repository cannot create the customer', async () => {
    await expect(
      createCustomerUseCase(
        {
          name: 'Alice',
        },
        adminContext,
        {
          createId: () => 'cst_test',
          findLatestCustomerBusinessId: async () => 'CST-0001',
          insertCustomer: async () => null,
        }
      )
    ).rejects.toMatchObject({
      code: 'CUSTOMER_CREATE_FAILED',
      statusCode: 500,
    });
  });

  it('retries with the next business id when insert hits a unique violation', async () => {
    let attempts = 0;
    const createdBusinessIds: string[] = [];

    const customer = await createCustomerUseCase(
      {
        name: 'Alice',
      },
      adminContext,
      {
        createId: () => 'cst_test',
        findLatestCustomerBusinessId: async () => 'CST-0042',
        insertCustomer: async (input) => {
          attempts += 1;
          createdBusinessIds.push(input.businessId);

          if (attempts === 1) {
            throw { code: '23505' };
          }

          return {
            ...customerRecord,
            businessId: input.businessId,
            id: input.id,
            name: input.name,
          };
        },
      }
    );

    expect(attempts).toBe(2);
    expect(createdBusinessIds).toEqual(['CST-0043', 'CST-0044']);
    expect(customer.businessId).toBe('CST-0044');
  });
});

const customerRecord = {
  businessId: 'CST-0001',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: null,
  id: 'cst_test',
  isActive: true,
  language: 'fr',
  name: 'Alice',
  notesContent: null,
  phone: null,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
