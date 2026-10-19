import {
  addDays,
  addMonths,
  getYear,
} from '@/server/features/memberships/use-cases/membership-date.helpers';

describe('addDays', () => {
  it('adds days within the same month', () => {
    expect(addDays('2026-06-10', 5)).toBe('2026-06-15');
  });

  it('rolls over a month boundary', () => {
    expect(addDays('2026-06-28', 5)).toBe('2026-07-03');
  });

  it('rolls over a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('lands on Feb 29 in a leap year', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('skips Feb 29 in a non-leap year', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('moves past the leap day', () => {
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
  });

  it('supports negative offsets', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('returns the same date when adding zero days', () => {
    expect(addDays('2026-06-15', 0)).toBe('2026-06-15');
  });
});

describe('addMonths', () => {
  it('adds months within the same year', () => {
    expect(addMonths('2026-01-15', 3)).toBe('2026-04-15');
  });

  it('rolls over the year boundary', () => {
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15');
  });

  it('returns the same date when adding zero months', () => {
    expect(addMonths('2026-06-15', 0)).toBe('2026-06-15');
  });

  it('advances a full year', () => {
    expect(addMonths('2026-06-15', 12)).toBe('2027-06-15');
  });

  // EDGE / KNOWN QUIRK: JS Date overflows short months instead of clamping.
  // Jan 31 + 1 month is not "Feb 28" — it spills into March.
  it('overflows month-end dates (Jan 31 + 1m -> Mar 03, non-leap year)', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-03-03');
  });

  it('overflows month-end dates differently in a leap year (Jan 31 + 1m -> Mar 02)', () => {
    expect(addMonths('2024-01-31', 1)).toBe('2024-03-02');
  });
});

describe('getYear', () => {
  it('extracts the year', () => {
    expect(getYear('2026-06-18')).toBe(2026);
  });

  it('handles the first day of the year', () => {
    expect(getYear('2026-01-01')).toBe(2026);
  });

  it('handles the last day of the year (no UTC off-by-one)', () => {
    expect(getYear('2025-12-31')).toBe(2025);
  });
});
