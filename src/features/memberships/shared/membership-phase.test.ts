import {
  formatMembershipPhase,
  getMembershipPhase,
  getMembershipPhaseTone,
} from '@/features/memberships/shared/membership-status';

const TODAY = '2026-10-19';

describe('getMembershipPhase', () => {
  it('is active while today sits inside the term', () => {
    // The case that exposed the stored-status bug: a term covering today was
    // imported from the legacy database already marked "expired".
    expect(getMembershipPhase('expired', '2026-10-02', '2026-11-01', TODAY)).toBe('active');
  });

  it('is upcoming before the term starts, however it was stored', () => {
    expect(getMembershipPhase('active', '2026-11-01', '2026-11-30', TODAY)).toBe('upcoming');
  });

  it('is expired after a one-off term ends', () => {
    expect(getMembershipPhase('active', '2026-09-01', '2026-10-01', TODAY)).toBe('expired');
  });

  it('is an unpaid renewal, not expired, when a recurring term ends', () => {
    // The subscription stays valid until it is cancelled; only the money is
    // behind, so the phase must not read as a dead subscription.
    expect(getMembershipPhase('active', '2026-09-01', '2026-10-01', TODAY, true)).toBe('unpaid');
    expect(getMembershipPhase('expired', '2026-09-01', '2026-10-01', TODAY, true)).toBe('unpaid');
  });

  it('leaves a recurring term active while it still covers today', () => {
    expect(getMembershipPhase('active', '2026-10-02', '2026-11-01', TODAY, true)).toBe('active');
  });

  it('treats both boundary days as covered', () => {
    expect(getMembershipPhase('active', TODAY, '2026-11-01', TODAY)).toBe('active');
    expect(getMembershipPhase('active', '2026-09-01', TODAY, TODAY)).toBe('active');
  });

  it('lets the stored word win only where a date cannot answer', () => {
    expect(getMembershipPhase('cancelled', '2026-10-02', '2026-11-01', TODAY)).toBe('cancelled');
    expect(getMembershipPhase('pending', '2026-10-02', '2026-11-01', TODAY)).toBe('pending');
  });
});

describe('phase presentation', () => {
  it('names every phase in one word', () => {
    expect(formatMembershipPhase('active')).toBe('Active');
    expect(formatMembershipPhase('upcoming')).toBe('Upcoming');
    expect(formatMembershipPhase('expired')).toBe('Expired');
    expect(formatMembershipPhase('unpaid')).toBe('Renewal unpaid');
    expect(formatMembershipPhase('cancelled')).toBe('Cancelled');
  });

  it('keeps colour on the state, never on the label alone', () => {
    expect(getMembershipPhaseTone('active')).toBe('positive');
    expect(getMembershipPhaseTone('upcoming')).toBe('caution');
    expect(getMembershipPhaseTone('expired')).toBe('neutral');
    expect(getMembershipPhaseTone('unpaid')).toBe('caution');
    expect(getMembershipPhaseTone('cancelled')).toBe('critical');
  });
});
