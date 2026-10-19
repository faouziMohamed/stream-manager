import {
  buildAgingBuckets,
  buildPaymentTrend,
  type PaymentTrendItem,
} from '@/features/payments/shared/payment-trend.mapper';

const TODAY = '2026-10-17';

function payment(overrides: Partial<PaymentTrendItem> = {}): PaymentTrendItem {
  return {
    amount: '100.00',
    dueDate: '2026-06-10',
    paidDate: null,
    status: 'unpaid',
    ...overrides,
  };
}

describe('buildPaymentTrend', () => {
  it('returns nothing when there is no live payment', () => {
    expect(buildPaymentTrend([])).toEqual([]);
    expect(buildPaymentTrend([payment({ status: 'cancelled' })])).toEqual([]);
  });

  it('bills on the due date and collects on the paid date', () => {
    const series = buildPaymentTrend([
      payment({ amount: '50.00', dueDate: '2026-06-30', paidDate: '2026-06-15', status: 'paid' }),
    ]);

    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ collected: 50, due: 50, month: '2026-06' });
  });

  it('splits a late payment across the month billed and the month settled', () => {
    const series = buildPaymentTrend([
      payment({ amount: '99.00', dueDate: '2026-06-30', paidDate: '2026-08-02', status: 'paid' }),
    ]);

    expect(series.map((point) => point.month)).toEqual(['2026-06', '2026-07', '2026-08']);
    expect(series[0]).toMatchObject({ collected: 0, due: 99 });
    expect(series[2]).toMatchObject({ collected: 99, due: 0 });
  });

  it('emits the quiet month between two billed months', () => {
    const series = buildPaymentTrend([
      payment({ dueDate: '2026-06-10' }),
      payment({ dueDate: '2026-08-10' }),
    ]);

    expect(series.map((point) => point.month)).toEqual(['2026-06', '2026-07', '2026-08']);
    expect(series[1]).toMatchObject({ collected: 0, due: 0 });
  });

  it('leaves cancelled money out of both series', () => {
    const series = buildPaymentTrend([
      payment({ amount: '40.00', dueDate: '2026-06-10' }),
      payment({ amount: '900.00', dueDate: '2026-06-10', status: 'cancelled' }),
    ]);

    expect(series[0]).toMatchObject({ due: 40 });
  });

  it('ignores an unparseable amount instead of charting NaN', () => {
    const series = buildPaymentTrend([
      payment({ amount: 'not-a-number', dueDate: '2026-06-10' }),
      payment({ amount: '25.00', dueDate: '2026-06-10' }),
    ]);

    expect(series[0]?.due).toBe(25);
  });
});

describe('buildAgingBuckets', () => {
  it('always returns the four brackets, even with nothing outstanding', () => {
    expect(buildAgingBuckets([], TODAY).map((bucket) => bucket.label)).toEqual([
      'Not yet due',
      '1–30 days',
      '31–60 days',
      '60+ days',
    ]);
    expect(buildAgingBuckets([], TODAY).every((bucket) => bucket.amount === 0)).toBe(true);
  });

  it('places each outstanding payment in the bracket for its age', () => {
    const buckets = buildAgingBuckets(
      [
        payment({ amount: '10.00', dueDate: '2026-11-17' }),
        payment({ amount: '20.00', dueDate: '2026-10-01' }),
        payment({ amount: '30.00', dueDate: '2026-09-01' }),
        payment({ amount: '40.00', dueDate: '2026-01-01', status: 'overdue' }),
      ],
      TODAY
    );

    expect(buckets.map((bucket) => bucket.amount)).toEqual([10, 20, 30, 40]);
    expect(buckets.map((bucket) => bucket.count)).toEqual([1, 1, 1, 1]);
  });

  it('counts a payment due today as not yet overdue', () => {
    const buckets = buildAgingBuckets([payment({ amount: '15.00', dueDate: TODAY })], TODAY);

    expect(buckets[0]).toMatchObject({ amount: 15, count: 1 });
  });

  it('excludes settled and cancelled money', () => {
    const buckets = buildAgingBuckets(
      [
        payment({ amount: '10.00', dueDate: '2026-09-01', paidDate: '2026-09-02', status: 'paid' }),
        payment({ amount: '20.00', dueDate: '2026-09-01', status: 'cancelled' }),
      ],
      TODAY
    );

    expect(buckets.every((bucket) => bucket.amount === 0)).toBe(true);
  });
});
