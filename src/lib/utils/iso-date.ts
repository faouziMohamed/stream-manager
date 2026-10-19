// Date <-> `YYYY-MM-DD` helpers that stay in the *local* timezone.
//
// react-day-picker hands back a Date at local midnight. Serialising it with
// `toISOString()` shifts it to UTC, which in any timezone ahead of UTC (e.g.
// UTC+1) rolls the calendar day back by one (picking the 12th yields "11").
// These helpers read/write the local calendar day so the selected day is kept.

export function formatIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date | undefined {
  if (value === '') return undefined;
  // No trailing "Z": parsed as local midnight, matching what the calendar emits.
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function formatDisplayDate(value: string, dateStyle: 'medium' | 'long' = 'medium'): string {
  const date = parseIsoDate(value);
  if (date === undefined) return '';
  return new Intl.DateTimeFormat('en', { dateStyle }).format(date);
}

export function todayIsoDate(now: Date = new Date()): string {
  return formatIsoDate(now);
}

/**
 * Adds calendar months in UTC, matching the server's term maths exactly so the
 * date a dialog previews is the date the API stores.
 */
export function addMonthsToIsoDate(value: string, months: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) return value;

  date.setUTCMonth(date.getUTCMonth() + months);

  return date.toISOString().slice(0, 10);
}

/**
 * The last day a term of `months` covers, its start day included.
 *
 * A month is not a month-end: a term starting 2 October runs to 1 November —
 * the day before the same date next month — and one starting 1 November runs
 * to 30 November. Adding whole months without stepping back a day made every
 * renewal one day longer than the one before it, so chained terms drifted.
 * A start on the 31st clamps to the target month's last day before stepping
 * back, which keeps January 31 from rolling into March.
 */
export function addTermMonths(value: string, months: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) return value;

  const startDay = date.getUTCDate();

  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);

  const lastDayOfTarget = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();

  date.setUTCDate(Math.min(startDay, lastDayOfTarget));
  date.setUTCDate(date.getUTCDate() - 1);

  return date.toISOString().slice(0, 10);
}
