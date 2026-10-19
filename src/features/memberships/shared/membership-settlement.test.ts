import {
  getChainSettlement,
  getTermSettlement,
} from '@/features/memberships/shared/membership-settlement';

function payment(membershipId: string, status: string, amount = '99.00') {
  return { amount, currencyCode: 'MAD', membershipId, status };
}

describe('getTermSettlement', () => {
  it('calls a term paid once nothing is outstanding', () => {
    expect(getTermSettlement('a', [payment('a', 'paid')])).toMatchObject({
      amountOwed: 0,
      label: 'Paid',
      state: 'paid',
    });
  });

  it('names what is still owed, in money', () => {
    expect(getTermSettlement('a', [payment('a', 'unpaid')])).toMatchObject({
      amountOwed: 99,
      currencyCode: 'MAD',
      state: 'unpaid',
    });
  });

  it('lets overdue win over merely unpaid', () => {
    const settlement = getTermSettlement('a', [
      payment('a', 'unpaid', '50.00'),
      payment('a', 'overdue', '25.00'),
    ]);

    expect(settlement.state).toBe('overdue');
    expect(settlement.amountOwed).toBe(75);
  });

  it('separates a term that was never billed from one that was not paid', () => {
    expect(getTermSettlement('a', []).state).toBe('unbilled');
    expect(getTermSettlement('a', [payment('b', 'unpaid')]).state).toBe('unbilled');
  });

  it('ignores a cancelled payment rather than counting it as owed', () => {
    expect(getTermSettlement('a', [payment('a', 'cancelled')]).state).toBe('unbilled');
    expect(getTermSettlement('a', [payment('a', 'cancelled'), payment('a', 'paid')]).state).toBe(
      'paid'
    );
  });

  it('survives an unparseable amount instead of reporting NaN owed', () => {
    expect(getTermSettlement('a', [payment('a', 'unpaid', 'not-a-number')]).amountOwed).toBe(0);
  });
});

function term(id: string, status = 'active') {
  return { id, status };
}

describe('getChainSettlement', () => {
  it('adds up what a whole chain still owes', () => {
    const settlement = getChainSettlement(
      [term('a'), term('b'), term('c')],
      [payment('a', 'paid'), payment('b', 'unpaid'), payment('c', 'unpaid')]
    );

    expect(settlement).toMatchObject({
      amountOwed: 198,
      paidCount: 1,
      state: 'unpaid',
      termCount: 3,
      unsettledCount: 2,
    });
  });

  it('reports the loudest state in the chain', () => {
    expect(
      getChainSettlement([term('a'), term('b')], [payment('a', 'paid'), payment('b', 'overdue')])
        .state
    ).toBe('overdue');
    expect(
      getChainSettlement([term('a'), term('b')], [payment('a', 'paid'), payment('b', 'paid')]).state
    ).toBe('paid');
  });

  it('leaves cancelled terms out of the money question', () => {
    const settlement = getChainSettlement(
      [term('a'), term('b', 'cancelled'), term('c')],
      [payment('a', 'paid'), payment('b', 'cancelled'), payment('c', 'paid')]
    );

    expect(settlement.state).toBe('paid');
    expect(settlement.termCount).toBe(2);
    expect(settlement.cancelledCount).toBe(1);
    expect(settlement.unbilledCount).toBe(0);
  });

  it('counts terms nobody ever billed', () => {
    const settlement = getChainSettlement([term('a'), term('b')], [payment('a', 'paid')]);

    expect(settlement.unbilledCount).toBe(1);
    expect(settlement.state).toBe('unbilled');
    expect(settlement.amountOwed).toBe(0);
  });

  it('reports an empty chain without inventing a debt', () => {
    expect(getChainSettlement([], [])).toMatchObject({
      amountOwed: 0,
      paidCount: 0,
      state: 'paid',
      termCount: 0,
    });
  });
});
