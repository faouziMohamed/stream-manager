import {
  buildTimelineDays,
  formatTimelineRangeLabel,
  stepTimelineStart,
} from '@/components/console/calendar/calendar-timeline.helpers';

describe('buildTimelineDays', () => {
  it('returns an inclusive run of days across a month boundary', () => {
    expect(buildTimelineDays('2026-10-28', 5)).toEqual([
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
  });

  it('handles a leap day and a year boundary', () => {
    expect(buildTimelineDays('2028-02-28', 3)).toEqual(['2028-02-28', '2028-02-29', '2028-03-01']);
    expect(buildTimelineDays('2026-12-31', 2)).toEqual(['2026-12-31', '2027-01-01']);
  });

  it('returns nothing for an invalid start or a non-positive window', () => {
    expect(buildTimelineDays('', 15)).toEqual([]);
    expect(buildTimelineDays('not-a-date', 15)).toEqual([]);
    expect(buildTimelineDays('2026-10-17', 0)).toEqual([]);
    expect(buildTimelineDays('2026-10-17', -3)).toEqual([]);
  });
});

describe('stepTimelineStart', () => {
  it('steps forward and backward by the window size', () => {
    expect(stepTimelineStart('2026-10-17', 15)).toBe('2026-11-01');
    expect(stepTimelineStart('2026-10-17', -15)).toBe('2026-10-02');
  });

  it('keeps the original value when the start cannot be parsed', () => {
    expect(stepTimelineStart('', 15)).toBe('');
  });
});

describe('formatTimelineRangeLabel', () => {
  it('names both ends of the window', () => {
    expect(formatTimelineRangeLabel(['2026-10-17', '2026-10-31'])).toBe(
      'Oct 17, 2026 – Oct 31, 2026'
    );
  });

  it('returns an empty label for an empty window', () => {
    expect(formatTimelineRangeLabel([])).toBe('');
  });
});
