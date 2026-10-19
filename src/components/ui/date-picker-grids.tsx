'use client';

import {
  buildMonthGrid,
  isOutOfRange,
  isSameDay,
  isSameMonth,
  monthShortLabels,
  weekdayShortLabels,
  YEAR_PAGE,
} from '@/lib/utils/date-picker.helpers';
import { formatIsoDate } from '@/lib/utils/iso-date';
import { cn } from '@/lib/utils';

const CELL = 'rounded-md text-sm tabular-nums transition-colors disabled:cursor-not-allowed';
const SELECTED = 'bg-(--sm-coral) font-semibold text-white';
const IDLE = 'text-(--sm-fg) hover:bg-(--sm-hover)';
const BLOCKED = 'text-(--sm-muted)/40';

function dayTone({
  blocked,
  outside,
  selected,
}: {
  blocked: boolean;
  outside: boolean;
  selected: boolean;
}): string {
  if (blocked) return BLOCKED;
  if (selected) return SELECTED;
  if (outside) return 'text-(--sm-muted)/60';

  return IDLE;
}

export function DayGrid({ maxDate, minDate, onPick, selectedDay, today, viewMonth }: DayGridProps) {
  const days = buildMonthGrid(viewMonth);
  const labels = weekdayShortLabels();

  return (
    <div role="grid" className="mt-3">
      <div className="mb-1 grid grid-cols-7 gap-1">
        {labels.map((label) => (
          <span
            className="py-1 text-center text-[11px] font-medium tracking-wide text-(--sm-muted) uppercase"
            key={label}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = formatIsoDate(day);
          const outside = !isSameMonth(day, viewMonth);
          const blocked = isOutOfRange(iso, minDate, maxDate);
          const selected = iso === selectedDay;
          const isToday = isSameDay(day, today);

          return (
            <button
              aria-current={isToday ? 'date' : undefined}
              aria-selected={selected}
              className={cn(
                CELL,
                'relative flex aspect-square items-center justify-center',
                dayTone({ blocked, outside, selected }),
                // Today keeps a marker even when another day is selected, so the
                // calendar always answers "where am I" at a glance.
                isToday && !selected && 'ring-1 ring-(--sm-coral-b) ring-inset'
              )}
              disabled={blocked}
              key={iso}
              onClick={() => onPick(iso)}
              role="gridcell"
              type="button"
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MonthGrid({ onPick, selectedMonth, viewYear }: MonthGridProps) {
  const labels = monthShortLabels();

  return (
    <div className="mt-3 grid grid-cols-3 gap-2" role="grid">
      {labels.map((label, index) => (
        <button
          aria-selected={selectedMonth === index}
          className={cn(CELL, 'py-2.5 capitalize', selectedMonth === index ? SELECTED : IDLE)}
          key={label}
          onClick={() => onPick(index)}
          role="gridcell"
          type="button"
        >
          {label}
        </button>
      ))}
      <span className="sr-only">{viewYear}</span>
    </div>
  );
}

export function YearGrid({ onPick, rangeStart, selectedYear }: YearGridProps) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2" role="grid">
      {Array.from({ length: YEAR_PAGE }, (_, index) => rangeStart + index).map((year) => (
        <button
          aria-selected={year === selectedYear}
          className={cn(CELL, 'py-2.5', year === selectedYear ? SELECTED : IDLE)}
          key={year}
          onClick={() => onPick(year)}
          role="gridcell"
          type="button"
        >
          {year}
        </button>
      ))}
    </div>
  );
}

/**
 * Hour and minute as chip grids rather than a spinner or a free text field —
 * picking a time is a choice among a handful of slots, so it should take one
 * click, and every reachable value is visible.
 */
export function TimeGrid({ hours, minutes, onPickHour, onPickMinute, selection }: TimeGridProps) {
  return (
    <div className="mt-3 space-y-3 border-t border-(--sm-border) pt-3">
      <div>
        <p className="text-xs font-medium text-(--sm-muted)">Hour</p>
        <div className="mt-1.5 grid grid-cols-6 gap-1">
          {hours.map((hour) => (
            <button
              aria-pressed={selection.hour === hour}
              className={cn(CELL, 'py-1.5 text-xs', selection.hour === hour ? SELECTED : IDLE)}
              key={hour}
              onClick={() => onPickHour(hour)}
              type="button"
            >
              {String(hour).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-(--sm-muted)">Minute</p>
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          {minutes.map((minute) => (
            <button
              aria-pressed={(selection.minute ?? 0) === minute}
              className={cn(
                CELL,
                'py-1.5 text-xs',
                (selection.minute ?? 0) === minute ? SELECTED : IDLE
              )}
              key={minute}
              onClick={() => onPickMinute(minute)}
              type="button"
            >
              :{String(minute).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

type DayGridProps = {
  maxDate?: string;
  minDate?: string;
  onPick: (isoDay: string) => void;
  selectedDay: string | null;
  today: Date;
  viewMonth: Date;
};

type MonthGridProps = {
  onPick: (monthIndex: number) => void;
  selectedMonth: number | null;
  viewYear: number;
};

type YearGridProps = {
  onPick: (year: number) => void;
  rangeStart: number;
  selectedYear: number | null;
};

type TimeGridProps = {
  hours: readonly number[];
  minutes: readonly number[];
  onPickHour: (hour: number) => void;
  onPickMinute: (minute: number) => void;
  selection: { hour: number | null; minute: number | null };
};
