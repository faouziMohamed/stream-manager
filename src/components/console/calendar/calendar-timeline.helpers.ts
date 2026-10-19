import { formatIsoDate, parseIsoDate } from '@/lib/utils/iso-date';

/** Atlas parity: a timeline page is 15 days, each day a fixed-width column. */
export const TIMELINE_COLUMN_WIDTH = 240;
export const TIMELINE_WINDOW_DAYS = 15;

export type CalendarLayout = 'month' | 'timeline';

/** Inclusive list of `YYYY-MM-DD` days starting at `start`. */
export function buildTimelineDays(start: string, dayCount: number): string[] {
  const first = parseIsoDate(start);

  if (first === undefined || dayCount <= 0) return [];

  return Array.from({ length: dayCount }, (_, index) =>
    formatIsoDate(new Date(first.getFullYear(), first.getMonth(), first.getDate() + index))
  );
}

export function stepTimelineStart(start: string, dayCount: number): string {
  const first = parseIsoDate(start);

  if (first === undefined) return start;

  return formatIsoDate(new Date(first.getFullYear(), first.getMonth(), first.getDate() + dayCount));
}

export function formatTimelineRangeLabel(days: readonly string[]): string {
  const first = days.at(0);
  const last = days.at(-1);

  if (first === undefined || last === undefined) return '';

  const start = parseIsoDate(first);
  const end = parseIsoDate(last);

  if (start === undefined || end === undefined) return '';

  const format = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${format.format(start)} – ${format.format(end)}`;
}
