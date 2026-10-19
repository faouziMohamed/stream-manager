import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { markPaymentPaidUseCase } from '@/server/features/payments/use-cases/mark-payment-paid.use-case';

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

describe('markPaymentPaidUseCase', () => {
  it('sets payment status to paid with a paid date', async () => {
    const payment = await markPaymentPaidUseCase(
      {
        id: 'pay_test',
        paidDate: '2026-05-12',
      },
      adminContext,
      {
        findCustomerById: async () => ({
          businessId: 'CST-0001',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          email: null,
          id: 'cst_test',
          isActive: true,
          language: 'fr',
          name: 'Customer',
          notesContent: null,
          phone: null,
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
        findPaymentById: async () => paymentRecord,
        updatePaymentPaid: async (id, paidDate) => ({
          ...paymentRecord,
          id,
          paidDate,
          status: 'paid',
        }),
      }
    );

    expect(payment.status).toBe('paid');
    expect(payment.paidDate).toBe('2026-05-12');
  });
});

const paymentRecord = {
  amount: '99.99',
  businessId: 'PAY-2026-0001',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  currencyCode: 'MAD',
  customerId: 'cst_test',
  dueDate: '2026-05-10',
  id: 'pay_test',
  membershipId: 'mbr_test',
  method: null,
  notes: null,
  paidDate: null,
  status: 'unpaid' as const,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
