'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatIsoDate, parseIsoDate } from '@/lib/utils/iso-date';

import {
  TIMELINE_COLUMN_WIDTH,
  TIMELINE_WINDOW_DAYS,
  buildTimelineDays,
} from './calendar-timeline.helpers';

const weekdayFormat = new Intl.DateTimeFormat('en', { weekday: 'short' });
const dayMonthFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' });
const fullDayFormat = new Intl.DateTimeFormat('en', { dateStyle: 'full' });

/**
 * The same events as the month grid, read as a chronological strip of days.
 * Fixed-width columns scroll horizontally, so a run of due dates reads as a
 * sequence rather than as scattered cells.
 */
export function CalendarTimeline<TEvent>({
  ariaLabel,
  events,
  renderEvent,
  today,
  windowStart,
}: CalendarTimelineProps<TEvent>) {
  const scroller = useRef<HTMLDivElement>(null);
  const days = buildTimelineDays(windowStart, TIMELINE_WINDOW_DAYS);
  const todayIso = formatIsoDate(today);
  // An arrow that does nothing looks broken. Each one is disabled at its own
  // bound, and neither is drawn when the whole window already fits.
  const [scrollState, setScrollState] = useState({
    canBack: false,
    canForward: false,
    scrollable: false,
  });

  function updateScrollState() {
    const element = scroller.current;

    if (element === null) return;

    const max = element.scrollWidth - element.clientWidth;

    setScrollState({
      canBack: element.scrollLeft > 1,
      canForward: element.scrollLeft < max - 1,
      scrollable: max > 1,
    });
  }

  useEffect(() => {
    updateScrollState();

    window.addEventListener('resize', updateScrollState);

    return () => window.removeEventListener('resize', updateScrollState);
  }, [windowStart]);

  function scrollPage(direction: -1 | 1) {
    const element = scroller.current;

    if (element === null) return;

    element.scrollBy({ behavior: 'smooth', left: direction * element.clientWidth });
  }

  return (
    <div className="relative">
      <div
        aria-label={ariaLabel}
        className="overflow-x-auto overscroll-x-contain rounded-xl border border-(--sm-border) bg-(--sm-surface) focus-visible:ring-2 focus-visible:ring-(--sm-coral-b) focus-visible:outline-none"
        onScroll={updateScrollState}
        onKeyDown={(event) => {
          if (event.key !== 'Home' && event.key !== 'End') return;

          event.preventDefault();
          scroller.current?.scrollTo({
            left: event.key === 'Home' ? 0 : (scroller.current?.scrollWidth ?? 0),
          });
        }}
        ref={scroller}
        role="region"
        tabIndex={0}
      >
        <div className="flex min-h-[22rem]">
          {days.map((iso) => {
            const date = parseIsoDate(iso);

            if (date === undefined) return null;

            const dayEvents = events.get(iso) ?? [];
            const isToday = iso === todayIso;
            const weekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <section
                aria-label={fullDayFormat.format(date)}
                className={cn(
                  'flex shrink-0 flex-col border-r border-(--sm-border) last:border-r-0',
                  isToday ? 'bg-(--sm-coral-s)/40' : weekend && 'bg-(--sm-bg)/60'
                )}
                key={iso}
                style={{ width: TIMELINE_COLUMN_WIDTH }}
              >
                <header
                  className={cn(
                    'border-b border-(--sm-border) px-3 py-2',
                    isToday ? 'bg-(--sm-coral-s)' : 'bg-(--sm-bg)/60'
                  )}
                >
                  <p className="text-xs text-(--sm-muted) capitalize">
                    {weekdayFormat.format(date)}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <time
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        isToday ? 'text-(--sm-coral)' : 'text-(--sm-fg)'
                      )}
                      dateTime={iso}
                    >
                      {dayMonthFormat.format(date)}
                    </time>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums',
                        isToday
                          ? 'bg-(--sm-coral) text-white'
                          : 'bg-(--sm-surface2) text-(--sm-muted)'
                      )}
                    >
                      {dayEvents.length}
                    </span>
                  </div>
                </header>

                <div className="flex-1 space-y-1.5 p-2">
                  {dayEvents.length === 0 ? (
                    <p className="px-1 py-3 text-xs text-(--sm-muted)">No events</p>
                  ) : (
                    dayEvents.map((event, index) => renderEvent(event, `${iso}-${index}`))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {scrollState.scrollable ? (
        <>
          <WithTooltip label="Scroll timeline back">
            <Button
              aria-label="Scroll timeline back"
              className="absolute top-1/2 left-2 z-10 -translate-y-1/2 shadow-lg"
              disabled={!scrollState.canBack}
              onClick={() => scrollPage(-1)}
              size="icon"
              variant="outline"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </WithTooltip>
          <WithTooltip label="Scroll timeline forward">
            <Button
              aria-label="Scroll timeline forward"
              className="absolute top-1/2 right-2 z-10 -translate-y-1/2 shadow-lg"
              disabled={!scrollState.canForward}
              onClick={() => scrollPage(1)}
              size="icon"
              variant="outline"
            >
              <ChevronRight className="size-4" />
            </Button>
          </WithTooltip>
        </>
      ) : null}
    </div>
  );
}

type CalendarTimelineProps<TEvent> = {
  ariaLabel: string;
  /** Events bucketed by `YYYY-MM-DD`. */
  events: Map<string, TEvent[]>;
  renderEvent: (event: TEvent, key: string) => ReactNode;
  today: Date;
  /** First day of the visible window, `YYYY-MM-DD`. */
  windowStart: string;
};
