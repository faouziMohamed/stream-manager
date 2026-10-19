import { buildHub, buildPaymentHistory } from '@/features/customers/shared/customer-hub.mapper';

const plans = [
  {
    currencyCode: 'MAD',
    durationMonths: 1,
    id: 'pln_a',
    name: 'Netflix Monthly',
    price: '50.00',
    serviceId: 'svc_a',
  },
];

function membership(id: string, startDate: string, status = 'active') {
  return {
    businessId: `MBR-${id}`,
    endDate: '2026-11-16',
    id,
    isRecurring: false,
    planId: 'pln_a',
    startDate,
    status,
  };
}

function payment(id: string, membershipId: string, status: string, amount = '50.00') {
  return {
    amount,
    businessId: `PAY-${id}`,
    currencyCode: 'MAD',
    dueDate: '2026-10-16',
    id,
    membershipId,
    paidDate: status === 'paid' ? '2026-10-16' : null,
    status,
  };
}

describe('buildHub', () => {
  it('groups each payment under the subscription it belongs to', () => {
    const hub = buildHub(
      [membership('mbr_1', '2026-10-16')],
      [payment('pay_1', 'mbr_1', 'paid'), payment('pay_2', 'mbr_1', 'unpaid')],
      plans
    );

    expect(hub.subscriptions).toHaveLength(1);
    expect(hub.subscriptions[0]?.payments.map((item) => item.id)).toEqual(['pay_1', 'pay_2']);
  });

  it('resolves the plan name so the UI never shows a raw plan id', () => {
    const hub = buildHub([membership('mbr_1', '2026-10-16')], [], plans);

    expect(hub.subscriptions[0]?.planLabel).toBe('Netflix Monthly');
  });

  it('falls back to a readable label for an unknown plan', () => {
    const hub = buildHub([membership('mbr_1', '2026-10-16')], [], []);

    expect(hub.subscriptions[0]?.planLabel).toBe('Unknown plan');
  });

  it('lists the newest subscription first', () => {
    const hub = buildHub(
      [membership('mbr_old', '2026-01-01'), membership('mbr_new', '2026-10-16')],
      [],
      plans
    );

    expect(hub.subscriptions.map((item) => item.id)).toEqual(['mbr_new', 'mbr_old']);
  });

  it('totals only what is still owed', () => {
    const hub = buildHub(
      [membership('mbr_1', '2026-10-16')],
      [
        payment('pay_1', 'mbr_1', 'paid', '50.00'),
        payment('pay_2', 'mbr_1', 'unpaid', '30.00'),
        payment('pay_3', 'mbr_1', 'overdue', '20.00'),
        payment('pay_4', 'mbr_1', 'cancelled', '99.00'),
      ],
      plans
    );

    expect(hub.outstandingTotal).toBe('50.00');
  });

  it('surfaces payments whose subscription is missing instead of dropping them', () => {
    const hub = buildHub(
      [membership('mbr_1', '2026-10-16')],
      [payment('pay_orphan', 'mbr_gone', 'unpaid')],
      plans
    );

    expect(hub.unlinkedPayments.map((item) => item.id)).toEqual(['pay_orphan']);
  });
});

describe('buildPaymentHistory', () => {
  it('splits each month into paid and outstanding', () => {
    const series = buildPaymentHistory([
      { ...payment('a', 'mbr_1', 'paid', '100.00'), dueDate: '2026-01-10' },
      { ...payment('b', 'mbr_1', 'unpaid', '40.00'), dueDate: '2026-01-20' },
    ]);

    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ month: '2026-01', outstanding: 40, paid: 100 });
  });

  it('counts overdue as outstanding, not paid', () => {
    const series = buildPaymentHistory([
      { ...payment('a', 'mbr_1', 'overdue', '70.00'), dueDate: '2026-03-01' },
    ]);

    expect(series[0]).toMatchObject({ outstanding: 70, paid: 0 });
  });

  it('excludes cancelled payments, which were never owed', () => {
    expect(
      buildPaymentHistory([
        { ...payment('a', 'mbr_1', 'cancelled', '99.00'), dueDate: '2026-03-01' },
      ])
    ).toEqual([]);
  });

  it('emits quiet months so a lapse is visible rather than compressed away', () => {
    const series = buildPaymentHistory([
      { ...payment('a', 'mbr_1', 'paid'), dueDate: '2026-01-05' },
      { ...payment('b', 'mbr_1', 'paid'), dueDate: '2026-04-05' },
    ]);

    expect(series.map((point) => point.month)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
    ]);
    expect(series[1]).toMatchObject({ outstanding: 0, paid: 0 });
  });

  it('spans a year boundary', () => {
    const series = buildPaymentHistory([
      { ...payment('a', 'mbr_1', 'paid'), dueDate: '2026-11-01' },
      { ...payment('b', 'mbr_1', 'paid'), dueDate: '2027-02-01' },
    ]);

    expect(series.map((point) => point.month)).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
  });

  it('returns nothing when there is no billable history', () => {
    expect(buildPaymentHistory([])).toEqual([]);
  });
});
