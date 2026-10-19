import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import {
  getPaymentUseCase,
  getPaymentsUseCase,
} from '@/server/features/payments/use-cases/get-payments.use-case';

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

const unauthenticatedContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: null,
  user: null,
};

describe('getPaymentsUseCase', () => {
  it('returns paginated payments with filters', async () => {
    const result = await getPaymentsUseCase(
      {
        customerId: 'cst_test',
        dueFrom: '2026-01-01',
        dueTo: '2026-01-31',
        page: 1,
        pageSize: 20,
        status: 'unpaid',
      },
      adminContext,
      {
        findPayments: async (input) => {
          expect(input.status).toBe('unpaid');
          expect(input.customerId).toBe('cst_test');

          return {
            items: [paymentRecord],
            total: 1,
          };
        },
      }
    );

    expect(result.items[0]?.id).toBe('pay_test');
    expect(result.pageInfo.total).toBe(1);
  });

  it('rejects unauthenticated users before listing payments', async () => {
    let findPaymentsCalls = 0;

    await expect(
      getPaymentsUseCase({ page: 1, pageSize: 20 }, unauthenticatedContext, {
        findPayments: async () => {
          findPaymentsCalls += 1;
          return { items: [], total: 0 };
        },
      })
    ).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });

    expect(findPaymentsCalls).toBe(0);
  });
});

describe('getPaymentUseCase', () => {
  it('returns a payment by id', async () => {
    const result = await getPaymentUseCase('pay_test', adminContext, {
      findPaymentById: async (id) => {
        expect(id).toBe('pay_test');
        return paymentRecord;
      },
    });

    expect(result?.businessId).toBe('PAY-2026-0001');
  });

  it('returns null when the payment does not exist', async () => {
    const result = await getPaymentUseCase('pay_missing', adminContext, {
      findPaymentById: async () => null,
    });

    expect(result).toBeNull();
  });

  it('serializes string timestamps without crashing', async () => {
    const result = await getPaymentUseCase('pay_string_dates', adminContext, {
      findPaymentById: async () =>
        ({
          ...paymentRecord,
          createdAt: '2026-01-01T00:00:00.000Z',
          id: 'pay_string_dates',
          updatedAt: '2026-01-02T00:00:00.000Z',
        }) as unknown as typeof paymentRecord,
    });

    expect(result?.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result?.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });
});

const paymentRecord = {
  amount: '99.99',
  businessId: 'PAY-2026-0001',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  currencyCode: 'MAD',
  customerId: 'cst_test',
  dueDate: '2026-01-31',
  id: 'pay_test',
  membershipId: 'mbr_test',
  method: null,
  notes: null,
  paidDate: null,
  status: 'unpaid' as const,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
