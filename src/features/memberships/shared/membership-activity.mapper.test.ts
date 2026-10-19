import { buildMembershipActivity } from '@/features/memberships/shared/membership-activity.mapper';

function term(
  id: string,
  overrides: Partial<{
    createdAt: string;
    renewedFromId: string | null;
    status: string;
    updatedAt: string;
  }> = {}
) {
  return {
    businessId: `MBR-${id}`,
    createdAt: overrides.createdAt ?? '2026-07-01T09:00:00.000Z',
    endDate: '2026-07-31',
    id,
    renewedFromId: overrides.renewedFromId ?? null,
    startDate: '2026-07-01',
    status: overrides.status ?? 'active',
    updatedAt: overrides.updatedAt ?? '2026-07-01T09:00:00.000Z',
  };
}

function payment(
  id: string,
  overrides: Partial<{ createdAt: string; paidDate: string | null; status: string }> = {}
) {
  return {
    amount: '99.00',
    businessId: `PAY-${id}`,
    createdAt: overrides.createdAt ?? '2026-07-01T09:00:00.000Z',
    currencyCode: 'MAD',
    dueDate: '2026-07-01',
    id,
    paidDate: overrides.paidDate ?? null,
    status: overrides.status ?? 'unpaid',
    updatedAt: overrides.createdAt ?? '2026-07-01T09:00:00.000Z',
  };
}

describe('buildMembershipActivity', () => {
  it('tells a first term from a renewal', () => {
    const events = buildMembershipActivity({
      payments: [],
      terms: [
        term('a', { createdAt: '2026-01-01T00:00:00.000Z' }),
        term('b', { createdAt: '2026-02-01T00:00:00.000Z', renewedFromId: 'a' }),
      ],
    });

    expect(events.map((event) => event.title)).toEqual(['Term renewed', 'Membership created']);
  });

  it('reads a settlement from the paid date, not the record date', () => {
    const events = buildMembershipActivity({
      payments: [payment('p1', { createdAt: '2026-07-01T00:00:00.000Z', paidDate: '2026-07-09' })],
      terms: [],
    });

    const settled = events.find((event) => event.kind === 'paid');

    expect(settled?.at).toBe('2026-07-09');
    expect(settled?.title).toBe('Payment settled');
  });

  it('shows a cancellation against the row’s last update', () => {
    const events = buildMembershipActivity({
      payments: [],
      terms: [term('a', { status: 'cancelled', updatedAt: '2026-08-15T12:00:00.000Z' })],
    });

    expect(events[0]).toMatchObject({
      at: '2026-08-15T12:00:00.000Z',
      kind: 'cancelled',
      title: 'Membership cancelled',
    });
  });

  it('places a year of terms in one timeline, newest first', () => {
    const events = buildMembershipActivity({
      payments: [payment('p1', { createdAt: '2026-09-01T00:00:00.000Z' })],
      terms: [
        term('a', { createdAt: '2026-01-01T00:00:00.000Z' }),
        term('b', { createdAt: '2026-06-01T00:00:00.000Z', renewedFromId: 'a' }),
      ],
    });

    const order = events.map((event) => event.at);

    expect(order).toEqual(order.toSorted().toReversed());
    expect(events).toHaveLength(3);
  });

  it('includes profile assignments with their own date', () => {
    const events = buildMembershipActivity({
      assignments: [
        { accountLabel: 'netflix1', assignedAt: '2026-07-02', id: 'asg_1', profileName: 'mfaouzi' },
      ],
      payments: [],
      terms: [],
    });

    expect(events[0]).toMatchObject({
      at: '2026-07-02',
      detail: 'netflix1',
      title: 'Profile “mfaouzi” assigned',
    });
  });

  it('returns nothing for a subscription with no history', () => {
    expect(buildMembershipActivity({ payments: [], terms: [] })).toEqual([]);
  });
});
