import { syncOverduePaymentsUseCase } from '@/server/features/payments/use-cases/sync-overdue-payments.use-case';

describe('syncOverduePaymentsUseCase', () => {
  it('marks unpaid payments before today as overdue', async () => {
    let capturedCutoffDate = '';
    const result = await syncOverduePaymentsUseCase(
      {
        markOverduePaymentsBefore: async (cutoffDate) => {
          capturedCutoffDate = cutoffDate;
          return [
            {
              ...paymentRecord,
              dueDate: '2026-05-10',
              id: `${cutoffDate}:pay_one`,
              status: 'overdue',
            },
          ];
        },
      },
      '2026-05-29'
    );

    expect(result.updatedCount).toBe(1);
    expect(capturedCutoffDate).toBe('2026-05-29');
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
