'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import {
  buildMonthGrid,
  isSameDay,
  isSameMonth,
  weekdayShortLabels,
} from '@/lib/utils/date-picker.helpers';
import { formatIsoDate } from '@/lib/utils/iso-date';
import { cn } from '@/lib/utils';

function dayNumberTone({ isToday, outside }: { isToday: boolean; outside: boolean }): string {
  if (isToday) return 'bg-(--sm-coral) font-semibold text-white';
  if (outside) return 'text-(--sm-muted)/60';

  return 'font-medium text-(--sm-fg)';
}

/** How many events a day cell shows before collapsing into "+N more". */
const VISIBLE_PER_DAY = 3;

/**
 * A month grid that renders whatever events it is handed, keyed by
 * `YYYY-MM-DD`. Six fixed weeks so the grid never changes height between
 * months, today marked, days outside the month dimmed but still readable —
 * a payment due on the 1st still matters when you are looking at the 31st.
 */
export function CalendarMonthGrid<TEvent>({
  events,
  onOpenDay,
  renderEvent,
  today,
  viewMonth,
}: CalendarMonthGridProps<TEvent>) {
  const days = buildMonthGrid(viewMonth);
  const labels = weekdayShortLabels();

  return (
    <div className="overflow-hidden rounded-xl border border-(--sm-border) bg-(--sm-surface)">
      <div className="grid grid-cols-7 border-b border-(--sm-border) bg-(--sm-bg)">
        {labels.map((label) => (
          <div className="px-3 py-2.5 text-xs font-medium text-(--sm-muted) capitalize" key={label}>
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const iso = formatIsoDate(day);
          const dayEvents = events.get(iso) ?? [];
          const outside = !isSameMonth(day, viewMonth);
          const isToday = isSameDay(day, today);

          return (
            <section
              aria-label={iso}
              className={cn(
                'min-h-24 min-w-0 border-(--sm-border) p-2',
                index % 7 !== 6 && 'border-r',
                index < days.length - 7 && 'border-b',
                outside && 'bg-(--sm-bg)/60'
              )}
              key={iso}
            >
              <div className="mb-2 flex h-6 items-center justify-between gap-1">
                <time
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                    dayNumberTone({ isToday, outside })
                  )}
                  dateTime={iso}
                >
                  {day.getDate()}
                </time>
                {isToday ? (
                  <span className="truncate text-[10px] font-medium text-(--sm-coral)">Today</span>
                ) : null}
              </div>

              <div className="space-y-1">
                {dayEvents
                  .slice(0, VISIBLE_PER_DAY)
                  .map((event, eventIndex) => renderEvent(event, `${iso}-${eventIndex}`))}
              </div>

              {dayEvents.length > VISIBLE_PER_DAY ? (
                <Button
                  className="mt-1 h-auto w-full justify-start px-1.5 py-1 text-[11px] font-semibold text-(--sm-coral)"
                  onClick={() => onOpenDay(iso)}
                  size="sm"
                  variant="ghost"
                >
                  +{dayEvents.length - VISIBLE_PER_DAY} more
                </Button>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

type CalendarMonthGridProps<TEvent> = {
  /** Events bucketed by `YYYY-MM-DD`. */
  events: Map<string, TEvent[]>;
  onOpenDay: (isoDay: string) => void;
  renderEvent: (event: TEvent, key: string) => ReactNode;
  today: Date;
  viewMonth: Date;
};
