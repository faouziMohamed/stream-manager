import type { TimelinePayload } from '@/features/timeline/ui/queries/use-timeline.queries';

export type ViewMode = 'gantt' | 'calendar';

export type TimelineItem = TimelinePayload['items'][number];

export type DerivedTimelineItem = TimelineItem & {
  status: 'active' | 'expired' | 'upcoming';
};

export type DateRange = {
  from: Date;
  to: Date;
};

export function deriveTimelineItem(item: TimelineItem): DerivedTimelineItem {
  const today = isoDateFromDate(new Date());
  let status: DerivedTimelineItem['status'] = 'active';

  if (item.endDate < today) {
    status = 'expired';
  } else if (item.startDate > today) {
    status = 'upcoming';
  }

  return { ...item, status };
}

export function buildInsights(items: DerivedTimelineItem[]) {
  return {
    active: items.filter((item) => item.status === 'active').length,
    expired: items.filter((item) => item.status === 'expired').length,
    upcoming: items.filter((item) => item.status === 'upcoming').length,
  };
}

export function buildMonthRange(items: DerivedTimelineItem[]): DateRange {
  const dates = items.flatMap((item) => [new Date(item.startDate), new Date(item.endDate)]);
  if (dates.length === 0) {
    const today = new Date();
    return { from: startOfMonth(addMonths(today, -1)), to: endOfMonth(addMonths(today, 2)) };
  }

  const min = new Date(Math.min(...dates.map((date) => date.getTime())));
  const max = new Date(Math.max(...dates.map((date) => date.getTime())));
  return { from: startOfMonth(min), to: endOfMonth(max) };
}

export function groupByCustomer(items: DerivedTimelineItem[]) {
  const grouped = new Map<string, DerivedTimelineItem[]>();

  for (const item of items) {
    const bucket = grouped.get(item.customerName) ?? [];
    bucket.push(item);
    grouped.set(item.customerName, bucket);
  }

  return [...grouped.entries()]
    .map(
      ([name, groupedItems]) =>
        [name, groupedItems.toSorted((a, b) => a.startDate.localeCompare(b.startDate))] as const
    )
    .toSorted((a, b) => a[0].localeCompare(b[0]));
}

export function statusPillClass(status: DerivedTimelineItem['status']): string {
  if (status === 'active') {
    return 'border-(--sm-emerald-b) bg-(--sm-emerald-s) text-(--sm-emerald) dark:bg-(--sm-emerald) dark:text-(--sm-coral-fg)';
  }
  if (status === 'upcoming') {
    return 'border-(--sm-gold-b) bg-(--sm-gold-s) text-(--sm-gold) dark:bg-(--sm-gold) dark:text-(--sm-coral-fg)';
  }
  return 'border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral) dark:bg-(--sm-coral) dark:text-(--sm-coral-fg)';
}

export function toneClass(tone: 'emerald' | 'gold' | 'coral'): string {
  if (tone === 'emerald') return 'border-(--sm-emerald-b) bg-(--sm-emerald-s)';
  if (tone === 'gold') return 'border-(--sm-gold-b) bg-(--sm-gold-s)';
  return 'border-(--sm-coral-b) bg-(--sm-coral-s)';
}

export function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export function isoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isoDateFromDate(date: Date): string {
  return isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function addMonths(date: Date, offset: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + offset);
  return next;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getMondayOffset(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export function splitMonths(from: Date, to: Date) {
  const months: Array<{ days: number; key: string; label: string }> = [];
  const cursor = startOfMonth(from);

  while (cursor <= to) {
    const monthEnd = endOfMonth(cursor);
    const visibleEnd = new Date(Math.min(monthEnd.getTime(), to.getTime()));
    const days = Math.floor((visibleEnd.getTime() - cursor.getTime()) / 86_400_000) + 1;
    months.push({
      days,
      key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
      label: cursor.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

export function clampDate(date: string, from: Date, to: Date): string {
  const fromValue = isoDateFromDate(from);
  const toValue = isoDateFromDate(to);
  if (date < fromValue) return fromValue;
  if (date > toValue) return toValue;
  return date;
}

export function dayDiff(from: Date | string, to: Date | string): number {
  const start = typeof from === 'string' ? new Date(from) : from;
  const end = typeof to === 'string' ? new Date(to) : to;
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}
