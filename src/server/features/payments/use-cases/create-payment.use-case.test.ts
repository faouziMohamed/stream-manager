import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { PaymentRecord } from '@/server/features/payments/schemas/model/payments.model';
import { createPaymentUseCase } from '@/server/features/payments/use-cases/create-payment.use-case';

const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_admin',
  user: { avatar: null, email: 'admin@example.com', id: 'usr_admin', name: 'Admin', role: 'admin' },
};

const anonContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: null,
  user: null,
};

const userContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: 'ses_user',
  user: { avatar: null, email: 'user@example.com', id: 'usr_user', name: 'User', role: 'user' },
};

const membership = { customerId: 'cst_1', id: 'mbr_1' };

const paymentInput = {
  amount: '50.00',
  currencyCode: 'USD',
  dueDate: '2026-01-15',
  membershipId: 'mbr_1',
  paidDate: null,
  status: 'paid' as const,
};

function makePaymentRecord(businessId: string): PaymentRecord {
  return {
    amount: '50.00',
    businessId,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    currencyCode: 'USD',
    customerId: 'cst_1',
    dueDate: '2026-01-15',
    id: 'pay_1',
    membershipId: 'mbr_1',
    method: null,
    notes: null,
    paidDate: '2026-01-15',
    status: 'paid',
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('createPaymentUseCase', () => {
  it('creates a payment for an existing membership', async () => {
    const result = await createPaymentUseCase(paymentInput, adminContext, {
      createPaymentId: () => 'pay_1',
      findLatestPaymentBusinessId: async () => null,
      findMembershipById: async () => membership,
      insertPayment: async () => makePaymentRecord('PAY-2026-0001'),
    });

    expect(result.id).toBe('pay_1');
    expect(result.businessId).toBe('PAY-2026-0001');
  });

  it('emails a receipt when the payment is recorded as already paid', async () => {
    const sent: { event: string; html: string; subject: string; to: string }[] = [];

    await createPaymentUseCase(paymentInput, adminContext, {
      createPaymentId: () => 'pay_1',
      findCustomerById: async () => ({ email: 'hermann@example.com', name: 'Hermann' }),
      findLatestPaymentBusinessId: async () => null,
      findMembershipById: async () => membership,
      insertPayment: async () => makePaymentRecord('PAY-2026-0001'),
      sendPaymentNotification: async (input) => {
        sent.push(input);
      },
    });

    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.event).toBe('PAYMENT_RECEIVED');
    expect(sent[0]?.to).toBe('hermann@example.com');
    expect(sent[0]?.html).toContain('PAY-2026-0001');
    expect(sent[0]?.html).toContain('50.00');
  });

  it('does not email a receipt for an unpaid charge', async () => {
    const sent: { event: string }[] = [];

    await createPaymentUseCase(
      { ...paymentInput, paidDate: null, status: 'unpaid' },
      adminContext,
      {
        createPaymentId: () => 'pay_1',
        findCustomerById: async () => ({ email: 'hermann@example.com', name: 'Hermann' }),
        findLatestPaymentBusinessId: async () => null,
        findMembershipById: async () => membership,
        insertPayment: async () => ({
          ...makePaymentRecord('PAY-2026-0001'),
          paidDate: null,
          status: 'unpaid',
        }),
        sendPaymentNotification: async (input) => {
          sent.push(input);
        },
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(sent).toHaveLength(0);
  });

  it('throws MEMBERSHIP_NOT_FOUND when membership does not exist', async () => {
    await expect(
      createPaymentUseCase(paymentInput, adminContext, {
        createPaymentId: () => 'pay_1',
        findLatestPaymentBusinessId: async () => null,
        findMembershipById: async () => null,
        insertPayment: async () => null,
      })
    ).rejects.toMatchObject({ code: 'MEMBERSHIP_NOT_FOUND' });
  });

  it('retries with incremented businessId on unique constraint violation', async () => {
    const businessIds: string[] = [];
    let attempt = 0;

    await createPaymentUseCase(paymentInput, adminContext, {
      createPaymentId: () => 'pay_1',
      findLatestPaymentBusinessId: async () => null,
      findMembershipById: async () => membership,
      insertPayment: async (input) => {
        businessIds.push(input.businessId);
        attempt += 1;
        if (attempt === 1) {
          const err = Object.assign(new Error('duplicate key'), { code: '23505' });
          throw err;
        }
        return makePaymentRecord(input.businessId);
      },
    });

    expect(businessIds).toHaveLength(2);
    expect(businessIds[0]).not.toBe(businessIds[1]);
  });

  it('exhausts retries and fails after repeated unique violations', async () => {
    let attempts = 0;

    await expect(
      createPaymentUseCase(paymentInput, adminContext, {
        createPaymentId: () => 'pay_1',
        findLatestPaymentBusinessId: async () => null,
        findMembershipById: async () => membership,
        insertPayment: async () => {
          attempts += 1;
          throw Object.assign(new Error('duplicate key'), { code: '23505' });
        },
      })
    ).rejects.toMatchObject({ code: 'PAYMENT_CREATE_FAILED' });

    expect(attempts).toBe(3);
  });

  it('rethrows a non-unique-violation error immediately without retrying', async () => {
    let attempts = 0;

    await expect(
      createPaymentUseCase(paymentInput, adminContext, {
        createPaymentId: () => 'pay_1',
        findLatestPaymentBusinessId: async () => null,
        findMembershipById: async () => membership,
        insertPayment: async () => {
          attempts += 1;
          throw new Error('connection reset');
        },
      })
    ).rejects.toThrow('connection reset');

    expect(attempts).toBe(1);
  });

  it('throws PAYMENT_CREATE_FAILED when insert returns null', async () => {
    await expect(
      createPaymentUseCase(paymentInput, adminContext, {
        createPaymentId: () => 'pay_1',
        findLatestPaymentBusinessId: async () => null,
        findMembershipById: async () => membership,
        insertPayment: async () => null,
      })
    ).rejects.toMatchObject({ code: 'PAYMENT_CREATE_FAILED' });
  });

  it('rejects non-admin users with FORBIDDEN', async () => {
    await expect(
      createPaymentUseCase(paymentInput, userContext, {
        createPaymentId: () => 'pay_1',
        findLatestPaymentBusinessId: async () => null,
        findMembershipById: async () => membership,
        insertPayment: async () => makePaymentRecord('PAY-2026-0001'),
      })
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('rejects unauthenticated users with UNAUTHENTICATED', async () => {
    await expect(
      createPaymentUseCase(paymentInput, anonContext, {
        createPaymentId: () => 'pay_1',
        findLatestPaymentBusinessId: async () => null,
        findMembershipById: async () => membership,
        insertPayment: async () => makePaymentRecord('PAY-2026-0001'),
      })
    ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
  });
});
