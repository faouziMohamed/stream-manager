import { markPaymentPaidInputSchema } from '@/server/features/payments/schemas/validators/payments.validators';

describe('markPaymentPaidInputSchema', () => {
  it('accepts valid input with paidDate', () => {
    const result = markPaymentPaidInputSchema.parse({
      id: 'pay_test',
      paidDate: '2026-01-15',
    });

    expect(result).toEqual({
      id: 'pay_test',
      paidDate: '2026-01-15',
    });
  });

  it('accepts valid input without paidDate', () => {
    const result = markPaymentPaidInputSchema.parse({
      id: 'pay_test',
    });

    expect(result).toEqual({
      id: 'pay_test',
    });
  });

  it('rejects empty id', () => {
    expect(() =>
      markPaymentPaidInputSchema.parse({
        id: '   ',
      })
    ).toThrow();
  });

  it('rejects invalid date format', () => {
    expect(() =>
      markPaymentPaidInputSchema.parse({
        id: 'pay_test',
        paidDate: '15-01-2026',
      })
    ).toThrow();
  });
});
