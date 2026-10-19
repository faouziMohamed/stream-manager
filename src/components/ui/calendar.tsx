'use client';

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import type { DayPickerProps } from 'react-day-picker';

import { cn } from '@/lib/utils';

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_START = new Date(CURRENT_YEAR - 10, 0);
const DEFAULT_END = new Date(CURRENT_YEAR + 10, 11);

function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      captionLayout="dropdown"
      startMonth={DEFAULT_START}
      endMonth={DEFAULT_END}
      className={cn('p-1', className)}
      classNames={{
        button_next:
          'inline-flex size-8 items-center justify-center rounded-md text-(--sm-muted) hover:bg-(--sm-hover) hover:text-(--sm-fg)',
        button_previous:
          'inline-flex size-8 items-center justify-center rounded-md text-(--sm-muted) hover:bg-(--sm-hover) hover:text-(--sm-fg)',
        // Visible label sitting under the transparent native <select> overlay.
        caption_label:
          'inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold text-(--sm-fg) hover:bg-(--sm-hover)',
        day: 'size-9 p-0 text-center text-sm',
        day_button:
          'size-9 rounded-md text-(--sm-fg) hover:bg-(--sm-hover) aria-selected:bg-(--sm-coral) aria-selected:text-(--sm-coral-fg)',
        disabled: 'opacity-40',
        // The real <select> react-day-picker renders for the dropdown caption,
        // laid transparently over the label so clicking opens the OS picker.
        dropdown: 'absolute inset-0 z-10 size-full cursor-pointer opacity-0',
        dropdown_root: 'relative inline-flex items-center',
        dropdowns: 'flex items-center justify-center gap-2',
        month_caption: 'flex h-9 items-center justify-center',
        month_grid: 'w-full border-collapse',
        months: 'flex flex-col',
        nav: 'absolute inset-x-1 top-1 flex items-center justify-between',
        outside: 'text-(--sm-muted) opacity-50',
        root: 'relative',
        selected: 'rounded-md bg-(--sm-coral) text-(--sm-coral-fg)',
        today: 'rounded-md border border-(--sm-coral-b)',
        week: 'mt-1 flex w-full',
        weekday: 'w-9 text-center text-[0.7rem] font-medium text-(--sm-muted)',
        weekdays: 'flex',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left') return <ChevronLeft className="size-4" />;
          if (orientation === 'right') return <ChevronRight className="size-4" />;
          return <ChevronDown className="size-3.5" />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
