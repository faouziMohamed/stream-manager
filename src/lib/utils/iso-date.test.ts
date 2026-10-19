import { addMonthsToIsoDate } from '@/lib/utils/iso-date';

describe('addMonthsToIsoDate', () => {
  it('adds calendar months', () => {
    expect(addMonthsToIsoDate('2026-06-11', 1)).toBe('2026-07-11');
    expect(addMonthsToIsoDate('2026-06-11', 3)).toBe('2026-09-11');
    expect(addMonthsToIsoDate('2026-11-15', 3)).toBe('2027-02-15');
  });

  it('rolls a short month over the way the server does', () => {
    // 31 Jan + 1 month has no 31 Feb, so UTC month arithmetic lands on 3 Mar.
    expect(addMonthsToIsoDate('2026-01-31', 1)).toBe('2026-03-03');
  });

  it('returns the input unchanged when it cannot be parsed', () => {
    expect(addMonthsToIsoDate('not-a-date', 2)).toBe('not-a-date');
  });
});
