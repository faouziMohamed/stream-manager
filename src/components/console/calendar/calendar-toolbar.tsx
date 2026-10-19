'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { MonthYearPicker } from '@/components/console/calendar/month-year-picker';
import type { CalendarLayout } from '@/components/console/calendar/calendar-timeline.helpers';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LAYOUTS: { label: string; value: CalendarLayout }[] = [
  { label: 'Month', value: 'month' },
  { label: 'Timeline', value: 'timeline' },
];

/**
 * Prev/next stepper, month picker or window label, layout switch, and status
 * filter chips.
 *
 * The filters carry their counts: an operator scanning for unpaid work should
 * not have to click a filter to discover it is empty.
 */
export function CalendarToolbar({
  counts,
  label,
  layout,
  onLabelChange,
  onLayoutChange,
  onNext,
  onPrevious,
  onStatusChange,
  onToday,
  showWindowControls = true,
  status,
  statuses,
  viewMonth,
}: CalendarToolbarProps) {
  const monthLayout = layout === 'month';

  // A surface that shows every event ignores the window, so it must not offer
  // a stepper that appears to change one.
  if (!showWindowControls) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <StatusFilters
          counts={counts}
          onStatusChange={onStatusChange}
          status={status}
          statuses={statuses}
        />
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="hidden flex-wrap items-center gap-1 sm:flex">
        <Button
          aria-label={monthLayout ? 'Previous month' : 'Previous 15 days'}
          className={monthLayout ? undefined : 'gap-1'}
          onClick={onPrevious}
          size={monthLayout ? 'icon' : 'sm'}
          variant={monthLayout ? 'ghost' : 'outline'}
        >
          <ChevronLeft className="size-4" />
          {monthLayout ? null : '−15 days'}
        </Button>
        {monthLayout && onLabelChange !== undefined ? (
          <MonthYearPicker label={label} onChange={onLabelChange} viewMonth={viewMonth} />
        ) : (
          <span className="min-w-44 px-2 text-sm font-semibold text-(--sm-fg)">{label}</span>
        )}
        <Button
          aria-label={monthLayout ? 'Next month' : 'Next 15 days'}
          className={monthLayout ? undefined : 'gap-1'}
          onClick={onNext}
          size={monthLayout ? 'icon' : 'sm'}
          variant={monthLayout ? 'ghost' : 'outline'}
        >
          {monthLayout ? null : '+15 days'}
          <ChevronRight className="size-4" />
        </Button>
        <Button className="ml-1" onClick={onToday} size="sm" variant="outline">
          Today
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden items-center rounded-lg border border-(--sm-border) bg-(--sm-surface) p-0.5 sm:flex">
          {LAYOUTS.map(({ label: layoutLabel, value }) => (
            <Button
              aria-pressed={layout === value}
              className={cn(
                'h-auto rounded-md px-2.5 py-1 text-xs font-medium',
                layout === value ? 'bg-(--sm-coral-s) text-(--sm-coral)' : 'text-(--sm-muted)'
              )}
              key={value}
              onClick={() => onLayoutChange(value)}
              size="sm"
              variant="ghost"
            >
              {layoutLabel}
            </Button>
          ))}
        </div>

        <StatusFilters
          counts={counts}
          onStatusChange={onStatusChange}
          status={status}
          statuses={statuses}
        />
      </div>
    </div>
  );
}

function StatusFilters({
  counts,
  onStatusChange,
  status,
  statuses,
}: Pick<CalendarToolbarProps, 'counts' | 'onStatusChange' | 'status' | 'statuses'>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {statuses.map((value) => (
        <Button
          aria-pressed={status === value}
          className={cn(
            'h-auto rounded-full border px-2.5 py-1 text-xs font-medium capitalize',
            status === value
              ? 'border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral)'
              : 'border-(--sm-border) text-(--sm-muted)'
          )}
          key={value}
          onClick={() => onStatusChange(value)}
          size="sm"
          variant="ghost"
        >
          {value} <span className="tabular-nums opacity-70">{counts[value] ?? 0}</span>
        </Button>
      ))}
    </div>
  );
}

type CalendarToolbarProps = {
  counts: Record<string, number>;
  label: string;
  layout: CalendarLayout;
  /** Omit to render the label as plain text, as the timeline window does. */
  onLabelChange?: (viewMonth: Date) => void;
  onLayoutChange: (layout: CalendarLayout) => void;
  onNext: () => void;
  onPrevious: () => void;
  onStatusChange: (status: string) => void;
  /** False on a surface that shows every event, where a window would be a lie. */
  showWindowControls?: boolean;
  onToday: () => void;
  status: string;
  statuses: readonly string[];
  viewMonth: Date;
};
