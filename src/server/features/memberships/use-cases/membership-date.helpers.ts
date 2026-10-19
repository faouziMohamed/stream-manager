export function addDays(dateValue: string, days: number): string {
  const date = parseIsoDate(dateValue);
  date.setUTCDate(date.getUTCDate() + days);

  return formatIsoDate(date);
}

export function addMonths(dateValue: string, months: number): string {
  const date = parseIsoDate(dateValue);
  date.setUTCMonth(date.getUTCMonth() + months);

  return formatIsoDate(date);
}

export function getYear(dateValue: string): number {
  return parseIsoDate(dateValue).getUTCFullYear();
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(dateValue: string): Date {
  return new Date(`${dateValue}T00:00:00.000Z`);
}
