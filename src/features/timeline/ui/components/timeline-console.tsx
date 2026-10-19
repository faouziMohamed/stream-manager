'use client';

import { Layers3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConsoleRefreshButton } from '@/components/console/shared/console-refresh-button';
import { Button } from '@/components/ui/button';
import type { TimelinePayload } from '@/features/timeline/ui/queries/use-timeline.queries';
import {
  TIMELINE_QUERY_KEY,
  useTimeline,
} from '@/features/timeline/ui/queries/use-timeline.queries';
import { cn } from '@/lib/utils/helpers';

import { buildInsights, buildMonthRange, deriveTimelineItem } from './timeline-console.helpers';
import type { DerivedTimelineItem, ViewMode } from './timeline-console.helpers';
import { CalendarView, GanttView, InsightChip, VIEW_META } from './timeline-console.views';

export function TimelineConsole({ initialData, initialView }: TimelineConsoleProps) {
  const { data, isFetching } = useTimeline(initialData);
  const router = useRouter();
  const [view, setViewState] = useState<ViewMode>(initialView);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const derived: DerivedTimelineItem[] = data.items.map((item) => deriveTimelineItem(item));
  const insights = buildInsights(derived);
  const monthRange = buildMonthRange(derived);

  function setView(next: ViewMode) {
    setViewState(next);
    router.push(`?view=${next}`, { scroll: false });
  }

  return (
    <section className="mt-6 space-y-4 rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
      <div className="flex flex-col gap-4 border-b border-(--sm-border) pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-(--sm-muted)">
            <Layers3 className="size-3.5" />
            {data.items.length} lifecycle items · {isFetching ? 'Refreshing…' : 'Updated just now'}
          </div>

          <div className="flex flex-wrap gap-2">
            <InsightChip label="Active now" value={String(insights.active)} tone="emerald" />
            <InsightChip label="Upcoming" value={String(insights.upcoming)} tone="gold" />
            <InsightChip label="Expired" value={String(insights.expired)} tone="coral" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ConsoleRefreshButton ariaLabel="Refresh timeline" queryKey={TIMELINE_QUERY_KEY} />
          <div className="inline-flex rounded-lg border border-(--sm-border) bg-(--sm-bg) p-1">
            {(Object.keys(VIEW_META) as ViewMode[]).map((item) => {
              const meta = VIEW_META[item];
              const Icon = meta.icon;
              const active = view === item;

              return (
                <Button
                  key={item}
                  type="button"
                  variant={active ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView(item)}
                  className={cn('gap-1.5', active ? 'shadow-none' : 'text-(--sm-muted)')}
                >
                  <Icon className="size-3.5" />
                  {meta.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-sm leading-6 text-(--sm-muted)">{VIEW_META[view].description}</p>

      {view === 'gantt' ? <GanttView items={derived} range={monthRange} /> : null}
      {view === 'calendar' ? (
        <CalendarView items={derived} month={calendarMonth} onMonthChange={setCalendarMonth} />
      ) : null}
    </section>
  );
}

type TimelineConsoleProps = {
  initialData: TimelinePayload;
  initialView: ViewMode;
};
