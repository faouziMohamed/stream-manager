'use client';

import { BarChart3, CalendarDays, MoveLeft, MoveRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { Button } from '@/components/ui/button';
import type {
  DateRange,
  DerivedTimelineItem,
  ViewMode,
} from '@/features/timeline/ui/components/timeline-console.helpers';
import {
  addMonths,
  clampDate,
  dayDiff,
  getMondayOffset,
  groupByCustomer,
  isoDate,
  isoDateFromDate,
  splitMonths,
  statusPillClass,
  toneClass,
} from '@/features/timeline/ui/components/timeline-console.helpers';
import { cn } from '@/lib/utils';

export const VIEW_META: Record<
  ViewMode,
  { description: string; icon: typeof BarChart3; label: string }
> = {
  gantt: {
    description: 'Shows how each membership spans the current time window.',
    icon: BarChart3,
    label: 'Gantt',
  },
  calendar: {
    description: 'Shows how dense the current month is by day.',
    icon: CalendarDays,
    label: 'Calendar',
  },
};

export function InsightChip({
  label,
  tone,
  value,
}: {
  label: string;
  tone: 'emerald' | 'gold' | 'coral';
  value: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs',
        toneClass(tone)
      )}
    >
      <span className="text-(--sm-muted)">{label}</span>
      <span className="font-semibold text-(--sm-fg)">{value}</span>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-(--sm-border) bg-(--sm-bg)">
      <p className="px-6 text-center text-sm text-(--sm-muted)">{label}</p>
    </div>
  );
}

export function GanttView({ items, range }: { items: DerivedTimelineItem[]; range: DateRange }) {
  const grouped = groupByCustomer(items);
  const totalDays = Math.max(1, dayDiff(range.from, range.to) + 1);
  const months = splitMonths(range.from, range.to);

  if (items.length === 0) {
    return <EmptyState label="No timeline data is available yet." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-(--sm-border)">
      <div style={{ minWidth: Math.max(totalDays * 5 + 220, 720) }}>
        <div className="flex border-b border-(--sm-border) bg-(--sm-surface2)">
          <div className="w-52 shrink-0 border-r border-(--sm-border) px-3 py-2 text-xs font-semibold text-(--sm-fg) uppercase">
            Customer / Plan
          </div>
          <div className="flex flex-1">
            {months.map((month) => (
              <div
                key={month.key}
                className="border-r border-(--sm-border) px-3 py-2 text-xs font-medium text-(--sm-fg)"
                style={{ width: `${(month.days / totalDays) * 100}%` }}
              >
                {month.label}
              </div>
            ))}
          </div>
        </div>

        {grouped.map(([customerName, customerItems]) => (
          <div key={customerName} className="flex border-b border-(--sm-border) last:border-b-0">
            <div className="w-52 shrink-0 border-r border-(--sm-border) bg-(--sm-surface2) px-3 py-3">
              <p className="truncate text-sm font-semibold text-(--sm-fg)">{customerName}</p>
              <p className="text-xs text-(--sm-muted)">{customerItems.length} memberships</p>
            </div>

            <div
              className="relative flex-1 bg-(--sm-bg)"
              style={{ minHeight: Math.max(customerItems.length * 28 + 8, 44) }}
            >
              {customerItems.map((item, index) => {
                const start = clampDate(item.startDate, range.from, range.to);
                const end = clampDate(item.endDate, range.from, range.to);
                const left = (dayDiff(range.from, start) / totalDays) * 100;
                const width = Math.max(((dayDiff(start, end) + 1) / totalDays) * 100, 0.8);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'absolute flex items-center overflow-hidden rounded border px-2 text-[10px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.18)]',
                      statusPillClass(item.status)
                    )}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      top: index * 28 + 6,
                      height: 22,
                    }}
                    title={`${item.customerName} · ${item.planName} · ${item.startDate} → ${item.endDate}`}
                  >
                    <span className="truncate">{item.planName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarView({
  items,
  month,
  onMonthChange,
}: {
  items: DerivedTimelineItem[];
  month: Date;
  onMonthChange: (month: Date) => void;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth() + 1;
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const firstWeekday = getMondayOffset(year, monthIndex);
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = month.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <WithTooltip label="Previous month">
          <Button
            aria-label="Previous month"
            variant="outline"
            size="icon-sm"
            onClick={() => onMonthChange(addMonths(month, -1))}
          >
            <MoveLeft className="size-4" />
          </Button>
        </WithTooltip>
        <p className="min-w-40 text-center text-sm font-semibold">{monthLabel}</p>
        <WithTooltip label="Next month">
          <Button
            aria-label="Next month"
            variant="outline"
            size="icon-sm"
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <MoveRight className="size-4" />
          </Button>
        </WithTooltip>
        <Button variant="ghost" size="sm" onClick={() => onMonthChange(new Date())}>
          Today
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px text-xs font-semibold text-(--sm-fg)">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="rounded-t-md bg-(--sm-surface2) px-2 py-2 text-center">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-(--sm-border)">
        {cells.map((day, index) => {
          if (day === null)
            return <div key={`empty-${index}`} className="min-h-28 bg-(--sm-surface2)" />;

          const date = isoDate(year, monthIndex, day);
          const dayItems = items.filter((item) => item.startDate <= date && item.endDate >= date);
          const isToday = date === isoDateFromDate(new Date());

          return (
            <article
              key={date}
              className={cn(
                // A phone gives each cell ~50px. Its content must be allowed
                // to shrink and must not paint over the next column.
                'min-h-28 min-w-0 overflow-hidden bg-(--sm-surface2) p-1 sm:p-2',
                isToday && 'ring-1 ring-(--sm-coral) ring-inset'
              )}
            >
              <p
                className={cn(
                  'text-xs font-semibold',
                  isToday ? 'text-(--sm-coral)' : 'text-(--sm-fg)'
                )}
              >
                {day}
              </p>
              <div className="mt-2 space-y-1">
                {dayItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      // On a phone the card is a compact colour swatch with
                      // the plan; customer and status badge only where the
                      // column is wide enough to hold them.
                      'min-w-0 overflow-hidden rounded-md border px-1 py-1 sm:px-1.5 sm:py-1 lg:space-y-1 lg:rounded-lg lg:p-2.5',
                      statusPillClass(item.status)
                    )}
                    title={`${item.customerName} · ${item.planName}`}
                  >
                    {/* The cell width is set by the calendar, not the screen:
                        a phone cell is ~50px, a tablet's is ~77px. Below `lg`
                        the chip carries the plan name only — a badge and a
                        customer name there would squeeze the name to nothing
                        and print the status four times across the week. */}
                    <div className="hidden items-start justify-between gap-2 sm:flex">
                      <div className="min-w-0">
                        <p className="truncate text-[10px] leading-3 font-semibold lg:text-[11px] lg:leading-4">
                          {item.planName}
                        </p>
                        <p className="hidden truncate text-[10px] leading-4 opacity-80 lg:block">
                          {item.customerName}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'hidden shrink-0 border px-2 py-0.5 text-[9px] font-semibold lg:inline-flex',
                          statusPillClass(item.status)
                        )}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {dayItems.length > 3 ? (
                  <p className="text-[9px] font-medium text-(--sm-fg)">
                    +{dayItems.length - 3} more
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
