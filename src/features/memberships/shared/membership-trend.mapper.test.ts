import {
  buildMembershipTrend,
  type MembershipTrendItem,
} from '@/features/memberships/shared/membership-trend.mapper';

type MembershipFixture = Partial<MembershipTrendItem> & {
  startDate: string;
  endDate: string;
};

function membership({
  endDate,
  startDate,
  id = 'mbr_1',
  isRecurring = false,
  renewedFromId = null,
  status = 'active',
}: MembershipFixture): MembershipTrendItem {
  return { endDate, id, isRecurring, renewedFromId, startDate, status };
}

describe('buildMembershipTrend', () => {
  it('counts a subscription as active in every month it covers, not just its first', () => {
    const series = buildMembershipTrend([
      membership({ endDate: '2026-04-10', startDate: '2026-01-10' }),
    ]);

    expect(series.map((point) => point.active)).toEqual([1, 1, 1, 1]);
  });

  it('counts a start only in the month it began', () => {
    const series = buildMembershipTrend([
      membership({ endDate: '2026-03-10', startDate: '2026-01-10' }),
    ]);

    expect(series.map((point) => point.started)).toEqual([1, 0, 0]);
  });

  it('overlaps concurrent subscriptions into a running total', () => {
    const series = buildMembershipTrend([
      membership({ endDate: '2026-03-01', id: 'mbr_1', startDate: '2026-01-01' }),
      membership({ endDate: '2026-04-01', id: 'mbr_2', startDate: '2026-02-01' }),
    ]);

    expect(series.map((point) => `${point.month}:${point.active}`)).toEqual([
      '2026-01:1',
      '2026-02:2',
      '2026-03:2',
      '2026-04:1',
    ]);
  });

  it('records a cancellation in the month it ended', () => {
    const series = buildMembershipTrend([
      membership({ endDate: '2026-02-01', startDate: '2026-01-01', status: 'cancelled' }),
    ]);

    expect(series.find((point) => point.month === '2026-02')?.cancelled).toBe(1);
    expect(series.find((point) => point.month === '2026-01')?.cancelled).toBe(0);
  });

  it('counts a renewal chain as one subscription, not one per term', () => {
    const series = buildMembershipTrend(
      [
        membership({
          endDate: '2026-01-31',
          id: 'mbr_1',
          isRecurring: true,
          startDate: '2026-01-01',
        }),
        membership({
          endDate: '2026-02-28',
          id: 'mbr_2',
          isRecurring: true,
          renewedFromId: 'mbr_1',
          startDate: '2026-02-01',
        }),
        membership({
          endDate: '2026-03-31',
          id: 'mbr_3',
          isRecurring: true,
          renewedFromId: 'mbr_2',
          startDate: '2026-03-01',
        }),
      ],
      '2026-04-05'
    );

    expect(series.map((point) => point.started)).toEqual([1, 0, 0, 0]);
    expect(series.map((point) => point.active)).toEqual([1, 1, 1, 1]);
    // The next term was due April 1: the subscription stays active, the
    // renewal is unpaid.
    expect(series.find((point) => point.month === '2026-04')?.unpaid).toBe(1);
    expect(series.find((point) => point.month === '2026-03')?.unpaid).toBe(0);
  });

  it('keeps a recurring subscription active after its term ends and reports the unpaid renewal', () => {
    const series = buildMembershipTrend(
      [membership({ endDate: '2026-02-09', isRecurring: true, startDate: '2026-01-10' })],
      '2026-03-15'
    );

    expect(series.map((point) => point.month)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(series.map((point) => point.active)).toEqual([1, 1, 1]);
    expect(series.find((point) => point.month === '2026-02')?.unpaid).toBe(1);
    expect(series.find((point) => point.month === '2026-03')?.unpaid).toBe(0);
  });

  it('does not report an unpaid renewal once the term has a successor', () => {
    const series = buildMembershipTrend(
      [
        membership({
          endDate: '2026-01-31',
          id: 'mbr_1',
          isRecurring: true,
          startDate: '2026-01-01',
        }),
        membership({
          endDate: '2026-02-28',
          id: 'mbr_2',
          isRecurring: true,
          renewedFromId: 'mbr_1',
          startDate: '2026-02-01',
        }),
        membership({
          endDate: '2026-03-31',
          id: 'mbr_3',
          isRecurring: true,
          renewedFromId: 'mbr_2',
          startDate: '2026-03-01',
        }),
      ],
      '2026-03-05'
    );

    expect(series.every((point) => point.unpaid === 0)).toBe(true);
  });

  it('ends a cancelled recurring subscription at its cancellation month', () => {
    const series = buildMembershipTrend(
      [
        membership({
          endDate: '2026-02-09',
          isRecurring: true,
          startDate: '2026-01-10',
          status: 'cancelled',
        }),
      ],
      '2026-03-15'
    );

    expect(series.map((point) => point.active)).toEqual([1, 1]);
    expect(series.find((point) => point.month === '2026-02')?.cancelled).toBe(1);
    expect(series.every((point) => point.unpaid === 0)).toBe(true);
  });

  it('ends a one-off subscription with its term without calling it unpaid', () => {
    const series = buildMembershipTrend(
      [membership({ endDate: '2026-02-09', startDate: '2026-01-10' })],
      '2026-03-15'
    );

    expect(series.map((point) => point.month)).toEqual(['2026-01', '2026-02']);
    expect(series.every((point) => point.unpaid === 0)).toBe(true);
  });

  it('spans a year boundary', () => {
    const series = buildMembershipTrend([
      membership({ endDate: '2027-01-01', startDate: '2026-11-01' }),
    ]);

    expect(series.map((point) => point.month)).toEqual(['2026-11', '2026-12', '2027-01']);
  });

  it('covers the full range when subscriptions do not overlap', () => {
    const series = buildMembershipTrend([
      membership({ endDate: '2026-02-01', id: 'mbr_1', startDate: '2026-01-01' }),
      membership({ endDate: '2026-06-01', id: 'mbr_2', startDate: '2026-05-01' }),
    ]);

    expect(series).toHaveLength(6);
    expect(series.find((point) => point.month === '2026-03')?.active).toBe(0);
  });

  it('returns nothing for no subscriptions', () => {
    expect(buildMembershipTrend([])).toEqual([]);
  });
});
