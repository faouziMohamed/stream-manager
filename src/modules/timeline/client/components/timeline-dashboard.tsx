'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import type { ElementType } from 'react';
import { BarChart2, CalendarDays, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { GanttChart } from '@/modules/timeline/client/components/gantt-chart';
import { TableGrid } from '@/modules/timeline/client/components/table-grid';
import { CalendarView } from '@/modules/timeline/client/components/calendar-view';
import type { TimelineSubscription } from '@/lib/db/repositories/timeline.repository';

type View = 'gantt' | 'grid' | 'calendar';

interface Props {
  subscriptions: TimelineSubscription[];
  initialView?: View;
  initialFromDate?: string;
  initialToDate?: string;
}

const VIEWS: { id: View; label: string; icon: ElementType }[] = [
  { id: 'gantt', label: 'Gantt', icon: BarChart2 },
  { id: 'grid', label: 'Tableau', icon: Grid3X3 },
  { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
];

function firstDayOfMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).toISOString().slice(0, 10);
}

export function TimelineDashboard({
  subscriptions: initialSubs,
  initialView,
  initialFromDate,
  initialToDate,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<View>(
    initialView ?? (searchParams.get('view') as View) ?? 'gantt'
  );

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);

  // For gantt/grid: date range
  const defaultFrom = firstDayOfMonth(today.getFullYear(), today.getMonth() + 1);
  const defaultTo = lastDayOfMonth(today.getFullYear(), today.getMonth() + 3);
  const [fromDate, setFromDate] = useState(initialFromDate ?? defaultFrom);
  const [toDate, setToDate] = useState(initialToDate ?? defaultTo);

  const updateView = useCallback(
    (v: View) => {
      setView(v);
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', v);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Calendar navigation
  const prevMonth = () => {
    if (calMonth === 1) {
      setCalYear((y) => y - 1);
      setCalMonth(12);
    } else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) {
      setCalYear((y) => y + 1);
      setCalMonth(1);
    } else setCalMonth((m) => m + 1);
  };
  const goToday = () => {
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth() + 1);
  };

  // For calendar: subscriptions in current month
  const calFrom = firstDayOfMonth(calYear, calMonth);
  const calTo = lastDayOfMonth(calYear, calMonth);
  const calSubs = initialSubs.filter((s) => s.startDate <= calTo && s.endDate >= calFrom);

  const monthLabel = new Date(calYear, calMonth - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Chronologie</h1>
          <p className="text-muted-foreground text-sm">Visualisation temporelle des abonnements</p>
        </div>

        {/* View toggles */}
        <div className="bg-muted/30 flex gap-1 rounded-lg border p-1">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              size="sm"
              variant={view === id ? 'default' : 'ghost'}
              className="gap-1.5 transition-all duration-200"
              onClick={() => updateView(id)}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Date range selector for gantt/grid */}
      {(view === 'gantt' || view === 'grid') && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Du</span>
            <DatePicker
              value={fromDate}
              onChange={(v) => v && setFromDate(v)}
              toDate={toDate ? new Date(toDate) : undefined}
              className="w-40"
            />
            <span className="text-muted-foreground">Au</span>
            <DatePicker
              value={toDate}
              onChange={(v) => v && setToDate(v)}
              fromDate={fromDate ? new Date(fromDate) : undefined}
              className="w-40"
            />
          </div>
        </div>
      )}

      {/* Month navigation for calendar */}
      {view === 'calendar' && (
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-semibold capitalize">
            {monthLabel}
          </span>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={goToday} className="text-xs">
            Aujourd&apos;hui
          </Button>
        </div>
      )}

      {/* Views */}
      {view === 'gantt' && (
        <GanttChart subscriptions={initialSubs} fromDate={fromDate} toDate={toDate} />
      )}
      {view === 'grid' && (
        <TableGrid subscriptions={initialSubs} fromDate={fromDate} toDate={toDate} />
      )}
      {view === 'calendar' && (
        <CalendarView subscriptions={calSubs} year={calYear} month={calMonth} />
      )}
    </div>
  );
}
