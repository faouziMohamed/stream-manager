'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { MonthGrid, YearGrid } from '@/components/ui/date-picker-grids';
import { YEAR_PAGE, yearPageStart } from '@/lib/utils/date-picker.helpers';

/**
 * The month label in a calendar toolbar, as a control.
 *
 * Stepping month by month to reach a date a year out is the thing that makes a
 * calendar tedious, so the label itself drills into the same month and year
 * grids the date picker uses rather than being dead text between two arrows.
 */
export function MonthYearPicker({ label, onChange, viewMonth }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'month' | 'year'>('month');

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const rangeStart = yearPageStart(viewMonth.getFullYear());

  function moveTo(next: Date) {
    onChange(next);
  }

  return (
    <>
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="min-w-44 gap-1.5 font-semibold"
        onClick={() => {
          setView('month');
          setOpen(true);
        }}
        size="sm"
        variant="ghost"
      >
        {label}
        <ChevronDown className="size-3.5 opacity-70" />
      </Button>

      {open ? (
        <div
          aria-label="Jump to month"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div
            className="w-full max-w-xs rounded-xl border border-(--sm-border) bg-(--sm-surface) p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between">
              <Button
                onClick={() => setView(view === 'year' ? 'month' : 'year')}
                size="sm"
                variant="ghost"
              >
                {view === 'year'
                  ? `${rangeStart}–${rangeStart + YEAR_PAGE - 1}`
                  : viewMonth.getFullYear()}
              </Button>
              <Button onClick={() => setOpen(false)} size="sm" variant="ghost">
                Close
              </Button>
            </header>

            {view === 'year' ? (
              <YearGrid
                onPick={(year) => {
                  moveTo(new Date(year, viewMonth.getMonth(), 1));
                  setView('month');
                }}
                rangeStart={rangeStart}
                selectedYear={viewMonth.getFullYear()}
              />
            ) : (
              <MonthGrid
                onPick={(monthIndex) => {
                  moveTo(new Date(viewMonth.getFullYear(), monthIndex, 1));
                  setOpen(false);
                }}
                selectedMonth={viewMonth.getMonth()}
                viewYear={viewMonth.getFullYear()}
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

type MonthYearPickerProps = {
  label: string;
  onChange: (viewMonth: Date) => void;
  viewMonth: Date;
};
