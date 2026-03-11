/**
 * Add months to a date, handling end-of-month edge cases.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Returns the end date for a subscription given start date and duration in months.
 * End date is inclusive (last day of coverage).
 */
export function computeEndDate(startDate: Date, durationMonths: number): Date {
  const end = addMonths(startDate, durationMonths);
  // Subtract 1 day — end date is the last day of coverage
  end.setDate(end.getDate() - 1);
  return end;
}

/**
 * Returns true if a date is in the past (before today at midnight UTC).
 */
export function isOverdue(dueDate: Date): boolean {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return dueDate < today;
}

/**
 * Returns true if a date is within the next N days.
 */
export function isUpcomingDue(dueDate: Date, withinDays: number = 7): boolean {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(future.getDate() + withinDays);
  return dueDate >= today && dueDate <= future;
}

/**
 * Format a date as YYYY-MM-DD (UTC).
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Parse a YYYY-MM-DD string into a UTC Date.
 */
export function parseDateISO(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Ensure a date string is a full ISO 8601 datetime string (with time + Z suffix)
 * so it satisfies the GraphQL DateTime scalar.
 * e.g. "2026-03-12"          → "2026-03-12T00:00:00.000Z"
 *      "2026-03-12T14:30"    → "2026-03-12T14:30:00.000Z"
 *      "2026-03-12T14:30:00.000Z" → unchanged
 */
export function toDateTimeString(value: string): string {
  // Already a full datetime with timezone info — return as-is
  if (/T.*[Z+\-]/.test(value)) return value;
  // Has time part but no timezone — append Z
  if (value.includes("T"))
    return `${value}:00.000Z`.replace(/(:00)+\.000Z$/, ":00.000Z");
  // Date-only — add midnight UTC time
  return `${value}T00:00:00.000Z`;
}
