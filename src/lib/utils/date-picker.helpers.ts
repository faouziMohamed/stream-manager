import { formatIsoDate, parseIsoDate } from '@/lib/utils/iso-date';

export type DatePickerView = 'day' | 'month' | 'year';

export const HOURS = Array.from({ length: 24 }, (_, index) => index);
export const MINUTE_STEPS = [0, 15, 30, 45];

/** How many years one page of the year grid shows. */
export const YEAR_PAGE = 12;

export type DateTimeSelection = {
  /** `YYYY-MM-DD`, or null when nothing is picked yet. */
  day: string | null;
  hour: number | null;
  minute: number | null;
};

/**
 * Six full weeks starting on Monday, so the grid height never jumps between
 * months — a shifting popup is the thing that makes a hand-built calendar
 * feel broken.
 */
export function buildMonthGrid(viewMonth: Date): Date[] {
  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const leadingDays = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - leadingDays);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

export function weekdayShortLabels(locale = 'en'): string[] {
  // 2024-01-01 was a Monday.
  const monday = new Date(2024, 0, 1);
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return formatter.format(day);
  });
}

export function monthShortLabels(locale = 'en'): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });

  return Array.from({ length: 12 }, (_, index) => formatter.format(new Date(2024, index, 1)));
}

export function yearPageStart(year: number): number {
  return Math.floor(year / YEAR_PAGE) * YEAR_PAGE;
}

export function isSameDay(left: Date, right: Date): boolean {
  return formatIsoDate(left) === formatIsoDate(right);
}

export function isSameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

/**
 * Plain `YYYY-MM-DD` strings sort correctly, so bounds are a string compare —
 * no reparsing into Date just to decide whether a cell is reachable.
 */
export function isOutOfRange(day: string, minDate?: string, maxDate?: string): boolean {
  if (minDate !== undefined && day < minDate) return true;

  return maxDate !== undefined && day > maxDate;
}

/** Splits the stored value into the three things the grids select. */
export function selectionFromValue(value: string): DateTimeSelection {
  if (value === '') {
    return { day: null, hour: null, minute: null };
  }

  const [datePart, timePart] = value.split('T');
  const day = datePart !== undefined && parseIsoDate(datePart) !== undefined ? datePart : null;

  if (timePart === undefined) {
    return { day, hour: null, minute: null };
  }

  const [hour, minute] = timePart.split(':');

  return {
    day,
    hour: hour === undefined ? null : Number(hour),
    minute: minute === undefined ? null : Number(minute),
  };
}

/**
 * Serialises back to what the field stores: `YYYY-MM-DD` for a date, and
 * `YYYY-MM-DDTHH:mm` once a time is involved. Returns '' while the selection
 * is still incomplete, so a half-picked value is never written.
 */
export function selectionValue(selection: DateTimeSelection, withTime: boolean): string {
  if (selection.day === null) return '';
  if (!withTime) return selection.day;
  if (selection.hour === null) return '';

  const hour = String(selection.hour).padStart(2, '0');
  const minute = String(selection.minute ?? 0).padStart(2, '0');

  return `${selection.day}T${hour}:${minute}`;
}

/** What the trigger button shows. */
export function formatTriggerLabel(value: string, withTime: boolean, locale = 'en'): string {
  const selection = selectionFromValue(value);

  if (selection.day === null) return '';

  const date = parseIsoDate(selection.day);
  if (date === undefined) return '';

  const datePart = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date);

  if (!withTime || selection.hour === null) return datePart;

  const hour = String(selection.hour).padStart(2, '0');
  const minute = String(selection.minute ?? 0).padStart(2, '0');

  return `${datePart} · ${hour}:${minute}`;
}
