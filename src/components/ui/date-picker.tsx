'use client';

import { CalendarDays, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DatePickerHeader } from '@/components/ui/date-picker-header';
import { DayGrid, MonthGrid, TimeGrid, YearGrid } from '@/components/ui/date-picker-grids';
import {
  HOURS,
  MINUTE_STEPS,
  YEAR_PAGE,
  type DatePickerView,
  type DateTimeSelection,
  formatTriggerLabel,
  isOutOfRange,
  selectionFromValue,
  selectionValue,
  yearPageStart,
} from '@/lib/utils/date-picker.helpers';
import { formatIsoDate, parseIsoDate } from '@/lib/utils/iso-date';
import { cn } from '@/lib/utils';

/**
 * A real calendar, not the browser's native date control.
 *
 * The native input renders whatever chrome the OS gives it — a different
 * picker on every platform, unstyleable, and formatted to the OS locale
 * rather than the app's. This is a day grid plus month/year drill-down built
 * from the same tokens as everything else, so picking a date looks like part
 * of the console instead of a form control that wandered in.
 *
 * It opens as a modal rather than an inline panel: a grid this size spends
 * its life fighting the page for room otherwise, and a modal gets a backdrop,
 * Escape-to-close and `role="dialog"` for free.
 *
 * Clicking the header drills day → month → year, so a date years away takes
 * three clicks instead of dozens of month-steps.
 *
 * `mode="datetime"` adds hour and minute chip grids and stores
 * `YYYY-MM-DDTHH:mm`; the default date mode stores plain `YYYY-MM-DD`.
 */
export function DatePicker({
  ariaLabel,
  className,
  clearable = false,
  disabled = false,
  error,
  id,
  maxDate,
  minDate,
  mode = 'date',
  onChange,
  placeholder = 'Pick a date',
  value,
}: DatePickerProps) {
  const withTime = mode === 'datetime';
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<DatePickerView>('day');
  const [selection, setSelection] = useState<DateTimeSelection>(() => selectionFromValue(value));
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value));
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function openPicker() {
    setSelection(selectionFromValue(value));
    setViewMonth(startOfMonth(value));
    setView('day');
    setOpen(true);
  }

  function commit(next: DateTimeSelection) {
    setSelection(next);
    const serialised = selectionValue(next, withTime);

    if (serialised !== '') {
      onChange(serialised);
    }

    // A date-only field has nothing left to choose once a day is picked.
    if (!withTime && next.day !== null) {
      setOpen(false);
    }
  }

  function pickDay(isoDay: string) {
    commit({ ...selection, day: isoDay, hour: withTime ? (selection.hour ?? 9) : null });
  }

  function step(direction: -1 | 1) {
    setViewMonth((current) => {
      const next = new Date(current);

      if (view === 'year') next.setFullYear(current.getFullYear() + direction * YEAR_PAGE);
      else if (view === 'month') next.setFullYear(current.getFullYear() + direction);
      else next.setMonth(current.getMonth() + direction);

      return next;
    });
  }

  function renderGrid() {
    if (view === 'year') {
      return (
        <YearGrid
          onPick={(year) => {
            setViewMonth((current) => {
              const next = new Date(current);
              next.setFullYear(year);
              return next;
            });
            setView('month');
          }}
          rangeStart={rangeStart}
          selectedYear={viewMonth.getFullYear()}
        />
      );
    }

    if (view === 'month') {
      return (
        <MonthGrid
          onPick={(monthIndex) => {
            setViewMonth((current) => {
              const next = new Date(current);
              next.setMonth(monthIndex);
              return next;
            });
            setView('day');
          }}
          selectedMonth={viewMonth.getMonth()}
          viewYear={viewMonth.getFullYear()}
        />
      );
    }

    return (
      <DayGrid
        maxDate={maxDate}
        minDate={minDate}
        onPick={pickDay}
        selectedDay={selection.day}
        today={today}
        viewMonth={viewMonth}
      />
    );
  }

  const label = formatTriggerLabel(value, withTime);
  const rangeStart = yearPageStart(viewMonth.getFullYear());
  const complete = selectionValue(selection, withTime) !== '';

  return (
    <>
      <button
        aria-describedby={error === undefined ? undefined : `${id ?? 'date'}-error`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className={cn(
          'border-input bg-background flex h-10 w-full items-center gap-2.5 rounded-md border px-3 text-left text-sm transition-colors',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error !== undefined && 'border-destructive',
          className
        )}
        disabled={disabled}
        id={id}
        onClick={openPicker}
        type="button"
      >
        <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-(--sm-muted)" />
        <span className={label === '' ? 'text-(--sm-muted)' : 'text-(--sm-fg)'}>
          {label === '' ? placeholder : label}
        </span>
      </button>

      {open ? (
        <div
          aria-label={ariaLabel ?? placeholder}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div
            className="max-h-[calc(100vh-2rem)] w-full max-w-xs overflow-y-auto rounded-xl border border-(--sm-border) bg-(--sm-surface) p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <DatePickerHeader
              onClose={() => setOpen(false)}
              onOpenMonth={() => setView(view === 'month' ? 'day' : 'month')}
              onOpenYear={() => setView(view === 'year' ? 'day' : 'year')}
              onStep={step}
              rangeStart={rangeStart}
              view={view}
              viewMonth={viewMonth}
            />

            {renderGrid()}

            {withTime && view === 'day' ? (
              <TimeGrid
                hours={HOURS}
                minutes={MINUTE_STEPS}
                onPickHour={(hour) => commit({ ...selection, hour })}
                onPickMinute={(minute) => commit({ ...selection, minute })}
                selection={selection}
              />
            ) : null}

            <footer className="mt-4 flex items-center gap-2">
              <Button
                className="gap-1.5"
                onClick={() => {
                  const iso = formatIsoDate(today);
                  if (isOutOfRange(iso, minDate, maxDate)) return;
                  setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  pickDay(iso);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <Clock className="size-3.5" />
                Today
              </Button>

              {clearable ? (
                <Button
                  onClick={() => {
                    setSelection({ day: null, hour: null, minute: null });
                    onChange('');
                    setOpen(false);
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Clear
                </Button>
              ) : null}

              {withTime ? (
                <Button
                  className="ml-auto"
                  disabled={!complete}
                  onClick={() => setOpen(false)}
                  size="sm"
                  type="button"
                  variant="accent"
                >
                  Confirm
                </Button>
              ) : null}
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}

function startOfMonth(value: string): Date {
  const parsed = parseIsoDate(value.split('T')[0] ?? '');
  const base = parsed ?? new Date();

  return new Date(base.getFullYear(), base.getMonth(), 1);
}

type DatePickerProps = {
  ariaLabel?: string;
  className?: string;
  /** Offers a Clear action for optional dates. */
  clearable?: boolean;
  disabled?: boolean;
  error?: string;
  id?: string;
  /** `YYYY-MM-DD` upper bound, inclusive. */
  maxDate?: string;
  /** `YYYY-MM-DD` lower bound, inclusive. */
  minDate?: string;
  mode?: 'date' | 'datetime';
  onChange: (value: string) => void;
  placeholder?: string;
  /** `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm` in datetime mode. */
  value: string;
};
