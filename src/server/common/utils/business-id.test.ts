import {
  nextChatBusinessId,
  nextCustomerBusinessId,
  nextMembershipBusinessId,
  nextPaymentBusinessId,
} from '@/server/common/utils/business-id';

describe('business id utilities', () => {
  it('starts customer ids at CST-0001', () => {
    expect(nextCustomerBusinessId()).toBe('CST-0001');
  });

  it('increments customer ids from the latest value', () => {
    expect(nextCustomerBusinessId('CST-0042')).toBe('CST-0043');
  });

  it('starts yearly membership ids at sequence 0001', () => {
    expect(nextMembershipBusinessId(2026)).toBe('MBR-2026-0001');
  });

  it('increments yearly membership ids within the same year', () => {
    expect(nextMembershipBusinessId(2026, 'MBR-2026-0009')).toBe('MBR-2026-0010');
  });

  it('resets yearly membership ids when the latest id is from another year', () => {
    expect(nextMembershipBusinessId(2026, 'MBR-2025-0999')).toBe('MBR-2026-0001');
  });

  it('starts yearly payment ids at sequence 0001', () => {
    expect(nextPaymentBusinessId(2026)).toBe('PAY-2026-0001');
  });

  it('increments yearly payment ids within the same year', () => {
    expect(nextPaymentBusinessId(2026, 'PAY-2026-0011')).toBe('PAY-2026-0012');
  });

  it('starts chat ids at CHT-0001', () => {
    expect(nextChatBusinessId()).toBe('CHT-0001');
  });

  it('increments chat ids from the latest value', () => {
    expect(nextChatBusinessId('CHT-0015')).toBe('CHT-0016');
  });
});
