import { buildMembershipChains } from '@/features/memberships/shared/membership-chains.mapper';

function term(id: string, startDate: string, endDate: string, renewedFromId: string | null = null) {
  return { endDate, id, renewedFromId, startDate };
}

describe('buildMembershipChains', () => {
  it('collapses a renewal chain into one entry covering every term', () => {
    const chains = buildMembershipChains([
      term('a', '2026-07-01', '2026-07-31'),
      term('b', '2026-08-01', '2026-08-31', 'a'),
      term('c', '2026-09-01', '2026-09-30', 'b'),
    ]);

    expect(chains).toHaveLength(1);
    expect(chains[0]?.termCount).toBe(3);
    expect(chains[0]?.coverageStart).toBe('2026-07-01');
    expect(chains[0]?.coverageEnd).toBe('2026-09-30');
  });

  it('acts on the newest term, whatever order the rows arrived in', () => {
    const chains = buildMembershipChains([
      term('c', '2026-09-01', '2026-09-30', 'b'),
      term('a', '2026-07-01', '2026-07-31'),
      term('b', '2026-08-01', '2026-08-31', 'a'),
    ]);

    expect(chains[0]?.current.id).toBe('c');
    expect(chains[0]?.id).toBe('c');
    expect(chains[0]?.terms.map((item) => item.id)).toEqual(['c', 'b', 'a']);
  });

  it('keeps unrelated subscriptions apart and sorts them by what ends last', () => {
    const chains = buildMembershipChains([
      term('x', '2026-01-01', '2026-01-31'),
      term('a', '2026-07-01', '2026-07-31'),
      term('b', '2026-08-01', '2026-08-31', 'a'),
    ]);

    expect(chains.map((chain) => chain.id)).toEqual(['b', 'x']);
    expect(chains.map((chain) => chain.termCount)).toEqual([2, 1]);
  });

  it('roots a chain at the oldest term it can see when the parent is off the page', () => {
    const chains = buildMembershipChains([
      term('b', '2026-08-01', '2026-08-31', 'a-not-loaded'),
      term('c', '2026-09-01', '2026-09-30', 'b'),
    ]);

    expect(chains).toHaveLength(1);
    expect(chains[0]?.termCount).toBe(2);
    expect(chains[0]?.coverageStart).toBe('2026-08-01');
  });

  it('terminates on a cycle instead of walking it forever', () => {
    const chains = buildMembershipChains([
      term('a', '2026-07-01', '2026-07-31', 'b'),
      term('b', '2026-08-01', '2026-08-31', 'a'),
    ]);

    expect(chains).toHaveLength(1);
    expect(chains[0]?.termCount).toBe(2);
  });

  it('returns nothing for no rows', () => {
    expect(buildMembershipChains([])).toEqual([]);
  });
});
