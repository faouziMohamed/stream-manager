import {
  buildMonthGrid,
  formatTriggerLabel,
  isOutOfRange,
  selectionFromValue,
  selectionValue,
  weekdayShortLabels,
  yearPageStart,
} from '@/lib/utils/date-picker.helpers';
import { formatIsoDate } from '@/lib/utils/iso-date';

describe('buildMonthGrid', () => {
  it('always returns six full weeks so the grid height never jumps', () => {
    for (const month of [0, 1, 7, 11]) {
      expect(buildMonthGrid(new Date(2026, month, 1))).toHaveLength(42);
    }
  });

  it('starts on the Monday on or before the first of the month', () => {
    // 2026-10-01 is a Thursday, so the grid opens on Monday 2026-09-28.
    const grid = buildMonthGrid(new Date(2026, 9, 1));

    expect(formatIsoDate(grid[0] as Date)).toBe('2026-09-28');
  });

  it('covers the whole month it is asked for', () => {
    const grid = buildMonthGrid(new Date(2026, 1, 1)).map((day) => formatIsoDate(day));

    expect(grid).toContain('2026-02-01');
    expect(grid).toContain('2026-02-28');
  });
});

describe('weekdayShortLabels', () => {
  it('is Monday-first', () => {
    expect(weekdayShortLabels('en')[0]).toBe('Mon');
  });
});

describe('yearPageStart', () => {
  it('pages years in blocks of twelve', () => {
    expect(yearPageStart(2026)).toBe(2016);
    expect(yearPageStart(2016)).toBe(2016);
    expect(yearPageStart(2015)).toBe(2004);
  });
});

describe('isOutOfRange', () => {
  it('respects an inclusive lower bound', () => {
    expect(isOutOfRange('2026-10-16', '2026-10-17')).toBe(true);
    expect(isOutOfRange('2026-10-17', '2026-10-17')).toBe(false);
  });

  it('respects an inclusive upper bound', () => {
    expect(isOutOfRange('2026-10-18', undefined, '2026-10-17')).toBe(true);
    expect(isOutOfRange('2026-10-17', undefined, '2026-10-17')).toBe(false);
  });

  it('allows anything when unbounded', () => {
    expect(isOutOfRange('1999-01-01')).toBe(false);
  });
});

describe('selectionFromValue', () => {
  it('reads a date-only value', () => {
    expect(selectionFromValue('2026-10-17')).toEqual({
      day: '2026-10-17',
      hour: null,
      minute: null,
    });
  });

  it('reads a datetime value', () => {
    expect(selectionFromValue('2026-10-17T14:30')).toEqual({
      day: '2026-10-17',
      hour: 14,
      minute: 30,
    });
  });

  it('treats an empty value as nothing picked', () => {
    expect(selectionFromValue('')).toEqual({ day: null, hour: null, minute: null });
  });
});

describe('selectionValue', () => {
  it('serialises a date', () => {
    expect(selectionValue({ day: '2026-10-17', hour: null, minute: null }, false)).toBe(
      '2026-10-17'
    );
  });

  it('serialises a datetime and pads both parts', () => {
    expect(selectionValue({ day: '2026-10-17', hour: 9, minute: 5 }, true)).toBe(
      '2026-10-17T09:05'
    );
  });

  it('defaults a missing minute to zero', () => {
    expect(selectionValue({ day: '2026-10-17', hour: 9, minute: null }, true)).toBe(
      '2026-10-17T09:00'
    );
  });

  it('refuses to emit a half-picked datetime', () => {
    expect(selectionValue({ day: '2026-10-17', hour: null, minute: null }, true)).toBe('');
    expect(selectionValue({ day: null, hour: 9, minute: 0 }, true)).toBe('');
  });
});

describe('formatTriggerLabel', () => {
  it('shows a long date', () => {
    expect(formatTriggerLabel('2026-10-17', false, 'en')).toBe('October 17, 2026');
  });

  it('appends the time in datetime mode', () => {
    expect(formatTriggerLabel('2026-10-17T14:30', true, 'en')).toBe('October 17, 2026 · 14:30');
  });

  it('is empty when nothing is picked, so the placeholder shows', () => {
    expect(formatTriggerLabel('', false, 'en')).toBe('');
  });
});
