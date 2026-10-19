import {
  buildPaymentEvents,
  countByStatus,
  toAgenda,
  type PaymentEventItem,
} from '@/features/payments/shared/payment-calendar.mapper';

const TODAY = '2026-10-17';

function payment(overrides: Partial<PaymentEventItem> & { id: string }): PaymentEventItem {
  return {
    amount: '50.00',
    businessId: `PAY-${overrides.id}`,
    createdAt: '2026-10-01T00:00:00.000Z',
    currencyCode: 'MAD',
    customerId: 'cst_1',
    dueDate: TODAY,
    membershipId: 'mbr_1',
    method: null,
    notes: null,
    paidDate: null,
    status: 'unpaid',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

const names = new Map([
  ['cst_1', 'Ayaldine Afretane'],
  ['cst_2', 'E2E Test Client'],
]);

describe('buildPaymentEvents', () => {
  it('buckets payments by the day they are due', () => {
    const events = buildPaymentEvents(
      [
        payment({ id: 'a', dueDate: '2026-10-16' }),
        payment({ id: 'b', dueDate: '2026-10-17' }),
        payment({ id: 'c', dueDate: '2026-10-17' }),
      ],
      names,
      TODAY
    );

    expect([...events.keys()].toSorted()).toEqual(['2026-10-16', '2026-10-17']);
    expect(events.get('2026-10-17')).toHaveLength(2);
  });

  it('marks each event past, today or future relative to the given day', () => {
    const events = buildPaymentEvents(
      [
        payment({ id: 'past', dueDate: '2026-09-01' }),
        payment({ id: 'now', dueDate: TODAY }),
        payment({ id: 'next', dueDate: '2026-12-25' }),
      ],
      names,
      TODAY
    );

    expect(events.get('2026-09-01')?.[0]?.timeframe).toBe('past');
    expect(events.get(TODAY)?.[0]?.timeframe).toBe('today');
    expect(events.get('2026-12-25')?.[0]?.timeframe).toBe('future');
  });

  it('keeps settled payments on the grid so the month reads as a full history', () => {
    const events = buildPaymentEvents(
      [payment({ id: 'paid', status: 'paid', paidDate: TODAY })],
      names,
      TODAY
    );

    expect(events.get(TODAY)).toHaveLength(1);
  });

  it('resolves the customer name so a cell never shows a raw id', () => {
    const events = buildPaymentEvents([payment({ id: 'a', customerId: 'cst_2' })], names, TODAY);

    expect(events.get(TODAY)?.[0]?.customerName).toBe('E2E Test Client');
  });

  it('falls back to a readable label for an unknown customer', () => {
    const events = buildPaymentEvents([payment({ id: 'a', customerId: 'cst_gone' })], names, TODAY);

    expect(events.get(TODAY)?.[0]?.customerName).toBe('Unknown customer');
  });

  it('leads each day with the largest amount', () => {
    const events = buildPaymentEvents(
      [
        payment({ id: 'small', amount: '20.00' }),
        payment({ id: 'big', amount: '300.00' }),
        payment({ id: 'mid', amount: '150.00' }),
      ],
      names,
      TODAY
    );

    expect(events.get(TODAY)?.map((event) => event.amount)).toEqual(['300.00', '150.00', '20.00']);
  });

  it('returns nothing for no payments', () => {
    expect(buildPaymentEvents([], names, TODAY).size).toBe(0);
  });
});

describe('toAgenda', () => {
  it('orders days chronologically regardless of input order', () => {
    const events = buildPaymentEvents(
      [
        payment({ id: 'c', dueDate: '2026-12-01' }),
        payment({ id: 'a', dueDate: '2026-01-15' }),
        payment({ id: 'b', dueDate: '2026-06-30' }),
      ],
      names,
      TODAY
    );

    expect(toAgenda(events).map(([day]) => day)).toEqual([
      '2026-01-15',
      '2026-06-30',
      '2026-12-01',
    ]);
  });

  it('runs backwards when asked, so the last thing that happened leads', () => {
    const events = buildPaymentEvents(
      [payment({ id: 'a', dueDate: '2026-01-15' }), payment({ id: 'b', dueDate: '2026-06-30' })],
      names,
      TODAY
    );

    expect(toAgenda(events, 'desc').map(([day]) => day)).toEqual(['2026-06-30', '2026-01-15']);
  });

  it('is empty when there is nothing scheduled', () => {
    expect(toAgenda(new Map())).toEqual([]);
  });
});

describe('countByStatus', () => {
  it('counts each status and the total under "all"', () => {
    const counts = countByStatus([
      payment({ id: 'a', status: 'paid' }),
      payment({ id: 'b', status: 'paid' }),
      payment({ id: 'c', status: 'unpaid' }),
      payment({ id: 'd', status: 'cancelled' }),
    ]);

    expect(counts).toMatchObject({ all: 4, cancelled: 1, paid: 2, unpaid: 1 });
  });

  it('omits a status nothing uses, so the filter can show a real zero', () => {
    const counts = countByStatus([payment({ id: 'a', status: 'paid' })]);

    expect(counts.overdue).toBeUndefined();
    expect(counts.all).toBe(1);
  });
});
