import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { archiveCustomerUseCase } from '@/server/features/customers/use-cases/archive-customer.use-case';

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

describe('archiveCustomerUseCase', () => {
  it('rejects non-admin users before reaching the repository layer', async () => {
    let countActiveMembershipsForCustomerCalls = 0;
    let findCustomerByIdCalls = 0;
    let updateCustomerCalls = 0;

    await expect(
      archiveCustomerUseCase('cst_test', userContext, {
        countActiveMembershipsForCustomer: async () => {
          countActiveMembershipsForCustomerCalls += 1;
          return 0;
        },
        findCustomerById: async () => {
          findCustomerByIdCalls += 1;
          return activeCustomerRecord;
        },
        updateCustomer: async () => {
          updateCustomerCalls += 1;
          return archivedCustomerRecord;
        },
      })
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });

    expect(findCustomerByIdCalls).toBe(0);
    expect(countActiveMembershipsForCustomerCalls).toBe(0);
    expect(updateCustomerCalls).toBe(0);
  });

  it('rejects archive for a missing customer', async () => {
    let countActiveMembershipsForCustomerCalls = 0;
    let updateCustomerCalls = 0;

    await expect(
      archiveCustomerUseCase('cst_missing', adminContext, {
        countActiveMembershipsForCustomer: async () => {
          countActiveMembershipsForCustomerCalls += 1;
          return 0;
        },
        findCustomerById: async () => null,
        updateCustomer: async () => {
          updateCustomerCalls += 1;
          return archivedCustomerRecord;
        },
      })
    ).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
      statusCode: 404,
    });

    expect(countActiveMembershipsForCustomerCalls).toBe(0);
    expect(updateCustomerCalls).toBe(0);
  });

  it('rejects archive for an already inactive customer', async () => {
    let countActiveMembershipsForCustomerCalls = 0;
    let updateCustomerCalls = 0;

    await expect(
      archiveCustomerUseCase('cst_test', adminContext, {
        countActiveMembershipsForCustomer: async () => {
          countActiveMembershipsForCustomerCalls += 1;
          return 0;
        },
        findCustomerById: async () => archivedCustomerRecord,
        updateCustomer: async () => {
          updateCustomerCalls += 1;
          return archivedCustomerRecord;
        },
      })
    ).rejects.toMatchObject({
      code: 'CUSTOMER_ALREADY_ARCHIVED',
      statusCode: 409,
    });

    expect(countActiveMembershipsForCustomerCalls).toBe(0);
    expect(updateCustomerCalls).toBe(0);
  });

  it('rejects archive when active memberships still use the customer', async () => {
    let updateCustomerCalls = 0;

    await expect(
      archiveCustomerUseCase('cst_test', adminContext, {
        countActiveMembershipsForCustomer: async () => 1,
        findCustomerById: async () => activeCustomerRecord,
        updateCustomer: async () => {
          updateCustomerCalls += 1;
          return archivedCustomerRecord;
        },
      })
    ).rejects.toMatchObject({
      code: 'CUSTOMER_HAS_ACTIVE_MEMBERSHIPS',
      statusCode: 409,
    });

    expect(updateCustomerCalls).toBe(0);
  });

  it('rejects when the repository cannot archive the customer', async () => {
    await expect(
      archiveCustomerUseCase('cst_test', adminContext, {
        countActiveMembershipsForCustomer: async () => 0,
        findCustomerById: async () => activeCustomerRecord,
        updateCustomer: async () => null,
      })
    ).rejects.toMatchObject({
      code: 'CUSTOMER_ARCHIVE_FAILED',
      statusCode: 500,
    });
  });

  it('archives an active customer for an admin user', async () => {
    const archivedCustomer = await archiveCustomerUseCase('cst_test', adminContext, {
      countActiveMembershipsForCustomer: async () => 0,
      findCustomerById: async () => activeCustomerRecord,
      updateCustomer: async (id, input) => ({
        ...activeCustomerRecord,
        ...input,
        id,
        isActive: input.isActive ?? activeCustomerRecord.isActive,
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
    });

    expect(archivedCustomer.isActive).toBe(false);
    expect(archivedCustomer.updatedAt.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });
});

const activeCustomerRecord = {
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

const archivedCustomerRecord = {
  ...activeCustomerRecord,
  isActive: false,
  language: 'fr',
};
