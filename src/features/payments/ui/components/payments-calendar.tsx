'use client';

import { useMemo, useState } from 'react';

import { CalendarMonthGrid } from '@/components/console/calendar/calendar-month-grid';
import { CalendarTimeline } from '@/components/console/calendar/calendar-timeline';
import {
  TIMELINE_WINDOW_DAYS,
  buildTimelineDays,
  formatTimelineRangeLabel,
  stepTimelineStart,
  type CalendarLayout,
} from '@/components/console/calendar/calendar-timeline.helpers';
import { CalendarToolbar } from '@/components/console/calendar/calendar-toolbar';
import {
  buildPaymentEvents,
  countByStatus,
  type PaymentEvent,
  type PaymentEventItem,
} from '@/features/payments/shared/payment-calendar.mapper';
import { PaymentDetailSheet } from '@/features/payments/ui/components/payment-detail-sheet';
import {
  PaymentChip,
  PaymentsAgendaList,
} from '@/features/payments/ui/components/payments-agenda-list';
import { todayIsoDate } from '@/lib/utils/iso-date';

const STATUSES = ['all', 'unpaid', 'overdue', 'paid', 'cancelled'] as const;

/**
 * Every payment event — past, due today, and upcoming — on one month grid or
 * as a chronological timeline of day columns, with an agenda alternative for
 * reading them as a list.
 */
export function PaymentsCalendar({
  customers,
  memberships,
  mode,
  payments,
}: PaymentsCalendarProps) {
  const [status, setStatus] = useState<string>('all');
  const [layout, setLayout] = useState<CalendarLayout>('month');
  const [viewMonth, setViewMonth] = useState(() => startOfThisMonth());
  const [timelineStart, setTimelineStart] = useState(() => todayIsoDate());
  const [viewPayment, setViewPayment] = useState<PaymentEvent | null>(null);
  const today = useMemo(() => new Date(), []);

  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers]
  );

  // The sheet names the customer one row above this one, so the membership
  // row carries its own identity rather than repeating the name.
  const membershipLabels = useMemo(
    () =>
      new Map(
        memberships.map((membership) => [
          membership.id,
          `${membership.businessId} (${membership.status})`,
        ])
      ),
    [memberships]
  );

  const visible = useMemo(
    () => (status === 'all' ? payments : payments.filter((item) => item.status === status)),
    [payments, status]
  );

  const events = useMemo(
    () => buildPaymentEvents(visible, customerNames),
    [customerNames, visible]
  );

  const counts = useMemo(() => countByStatus(payments), [payments]);
  const monthLabel = new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(viewMonth);
  const timelineDays = useMemo(
    () => buildTimelineDays(timelineStart, TIMELINE_WINDOW_DAYS),
    [timelineStart]
  );
  const label = layout === 'month' ? monthLabel : formatTimelineRangeLabel(timelineDays);

  function step(direction: -1 | 1) {
    if (layout === 'timeline') {
      setTimelineStart((current) => stepTimelineStart(current, direction * TIMELINE_WINDOW_DAYS));
      return;
    }

    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  function goToToday() {
    setViewMonth(startOfThisMonth());
    setTimelineStart(todayIsoDate());
  }

  function renderSurface() {
    if (mode === 'agenda') return <PaymentsAgendaList events={events} onOpen={setViewPayment} />;

    return (
      <>
        <div className="sm:hidden">
          <PaymentsAgendaList events={events} onOpen={setViewPayment} />
        </div>
        <div className="hidden sm:block">
          {layout === 'timeline' ? (
            <CalendarTimeline
              ariaLabel="Payments timeline"
              events={events}
              renderEvent={(event, key) => (
                <PaymentChip event={event} key={key} onOpen={setViewPayment} />
              )}
              today={today}
              windowStart={timelineStart}
            />
          ) : (
            <CalendarMonthGrid
              events={events}
              onOpenDay={(day) => setViewMonth(new Date(`${day}T00:00:00`))}
              renderEvent={(event, key) => (
                <PaymentChip event={event} key={key} onOpen={setViewPayment} />
              )}
              today={today}
              viewMonth={viewMonth}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <section className="mt-6">
        <CalendarToolbar
          counts={counts}
          label={label}
          layout={layout}
          onLabelChange={layout === 'month' ? setViewMonth : undefined}
          onLayoutChange={setLayout}
          onNext={() => step(1)}
          onPrevious={() => step(-1)}
          onStatusChange={setStatus}
          onToday={goToToday}
          showWindowControls={mode === 'calendar'}
          status={status}
          statuses={STATUSES}
          viewMonth={viewMonth}
        />

        {renderSurface()}
      </section>

      <PaymentDetailSheet
        customerName={
          viewPayment === null
            ? ''
            : (customerNames.get(viewPayment.customerId) ?? viewPayment.customerId)
        }
        membershipLabel={
          viewPayment === null
            ? ''
            : (membershipLabels.get(viewPayment.membershipId) ?? viewPayment.membershipId)
        }
        onOpenChangeAction={(open) => {
          if (!open) setViewPayment(null);
        }}
        open={viewPayment !== null}
        payment={viewPayment}
      />
    </>
  );
}

function startOfThisMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

type PaymentsCalendarProps = {
  customers: { id: string; name: string }[];
  memberships: { businessId: string; customerId: string; id: string; status: string }[];
  /** Which reading of the same events to render; owned by the page tabs. */
  mode: 'agenda' | 'calendar';
  payments: PaymentEventItem[];
};
