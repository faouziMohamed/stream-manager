'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { YEAR_PAGE, monthShortLabels, type DatePickerView } from '@/lib/utils/date-picker.helpers';

/** Month and year act as controls, not labels: clicking either drills into its grid. */
export function DatePickerHeader({
  onClose,
  onOpenMonth,
  onOpenYear,
  onStep,
  rangeStart,
  view,
  viewMonth,
}: DatePickerHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-1">
      <Button
        aria-label="Previous"
        onClick={() => onStep(-1)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-1">
        <Button onClick={() => onOpenMonth()} size="sm" type="button" variant="ghost">
          {monthShortLabels()[viewMonth.getMonth()]}
        </Button>
        <Button onClick={() => onOpenYear()} size="sm" type="button" variant="ghost">
          {view === 'year'
            ? `${rangeStart}–${rangeStart + YEAR_PAGE - 1}`
            : viewMonth.getFullYear()}
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          aria-label="Next"
          onClick={() => onStep(1)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          aria-label="Close"
          onClick={() => onClose()}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
    </header>
  );
}

type DatePickerHeaderProps = {
  onClose: () => void;
  onOpenMonth: () => void;
  onOpenYear: () => void;
  onStep: (direction: -1 | 1) => void;
  rangeStart: number;
  view: DatePickerView;
  viewMonth: Date;
};
