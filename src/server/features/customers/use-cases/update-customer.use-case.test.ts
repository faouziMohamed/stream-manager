import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { updateCustomerUseCase } from '@/server/features/customers/use-cases/update-customer.use-case';

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

describe('updateCustomerUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let findCustomerByIdCalls = 0;
    let updateCustomerCalls = 0;

    await expect(
      updateCustomerUseCase(
        {
          id: 'cst_test',
          name: 'Alice Updated',
        },
        userContext,
        {
          findCustomerById: async () => {
            findCustomerByIdCalls += 1;
            return customerRecord;
          },
          updateCustomer: async () => {
            updateCustomerCalls += 1;
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

    expect(findCustomerByIdCalls).toBe(0);
    expect(updateCustomerCalls).toBe(0);
  });

  it('rejects updates for a missing customer', async () => {
    let updateCustomerCalls = 0;

    await expect(
      updateCustomerUseCase(
        {
          id: 'cst_missing',
          name: 'Alice Updated',
        },
        adminContext,
        {
          findCustomerById: async () => null,
          updateCustomer: async () => {
            updateCustomerCalls += 1;
            return customerRecord;
          },
        }
      )
    ).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
      statusCode: 404,
    });

    expect(updateCustomerCalls).toBe(0);
  });

  it('rejects when the repository cannot update the customer', async () => {
    await expect(
      updateCustomerUseCase(
        {
          id: 'cst_test',
          name: 'Alice Updated',
        },
        adminContext,
        {
          findCustomerById: async () => customerRecord,
          updateCustomer: async () => null,
        }
      )
    ).rejects.toMatchObject({
      code: 'CUSTOMER_UPDATE_FAILED',
      statusCode: 500,
    });
  });

  it('updates partial customer fields for an admin user', async () => {
    const updatedCustomer = await updateCustomerUseCase(
      {
        id: 'cst_test',
        isActive: false,
        language: 'fr',
        notesContent: { note: 'updated' },
      },
      adminContext,
      {
        findCustomerById: async () => customerRecord,
        updateCustomer: async (id, input) => ({
          ...customerRecord,
          ...input,
          id,
          isActive: input.isActive ?? customerRecord.isActive,
          notesContent: input.notesContent ?? customerRecord.notesContent,
          updatedAt: new Date('2026-02-01T00:00:00.000Z'),
        }),
      }
    );

    expect(updatedCustomer.id).toBe('cst_test');
    expect(updatedCustomer.isActive).toBe(false);
    expect(updatedCustomer.notesContent).toEqual({ note: 'updated' });
    expect(updatedCustomer.updatedAt.toISOString()).toBe('2026-02-01T00:00:00.000Z');
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
