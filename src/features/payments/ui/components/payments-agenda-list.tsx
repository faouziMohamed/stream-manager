'use client';

import { CalendarClock, CreditCard, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { Button } from '@/components/ui/button';
import { toAgenda, type PaymentEvent } from '@/features/payments/shared/payment-calendar.mapper';
import {
  formatPaymentStatus,
  getPaymentStatusTone,
} from '@/features/payments/shared/payment-status';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';

/**
 * The payments in date order, grouped under the day they fall due.
 *
 * Shared by the Agenda tab and the phone layout of the Calendar tab so the two
 * cannot drift apart. `action` lets the Agenda add the one control it has —
 * settling the payment — without the calendar cells inheriting it.
 */
export function PaymentsAgendaList({
  events,
  onOpen,
  order = 'asc',
  renderAction,
}: {
  events: Map<string, PaymentEvent[]>;
  onOpen: (event: PaymentEvent) => void;
  /** Which way the day groups run; the agenda makes this a choice. */
  order?: 'asc' | 'desc';
  /** Rendered at the end of each row, before the membership link. */
  renderAction?: (event: PaymentEvent) => ReactNode;
}) {
  const days = toAgenda(events, order);

  if (days.length === 0) {
    return (
      <ConsoleEmptyState
        description="No payment events match this filter."
        icon={<CalendarClock className="size-4" />}
        title="Nothing scheduled"
      />
    );
  }

  return (
    <ol className="space-y-4">
      {days.map(([day, dayEvents]) => (
        <li key={day}>
          <div className="mb-2 flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-(--sm-fg)">
              {formatDisplayDate(day, 'long')}
            </h3>
            <span className="text-xs text-(--sm-muted)">
              {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
            </span>
          </div>
          <ul className="space-y-1.5">
            {dayEvents.map((event) => (
              <li className="flex items-stretch gap-2" key={event.id}>
                <PaymentChip className="flex-1" event={event} expanded onOpen={onOpen} />
                {renderAction?.(event)}
                <WithTooltip label="Open the membership this payment belongs to">
                  <Link
                    aria-label={`View ${event.businessId}`}
                    className="inline-flex w-10 shrink-0 items-center justify-center rounded-lg border border-(--sm-border2) text-(--sm-muted) hover:bg-(--sm-ghost-hover) hover:text-(--sm-fg)"
                    href={ROUTES.console.membershipDetail(event.membershipId)}
                  >
                    <ExternalLink className="size-3.5" />
                  </Link>
                </WithTooltip>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function PaymentChip({
  className,
  event,
  expanded = false,
  onOpen,
}: {
  className?: string;
  event: PaymentEvent;
  expanded?: boolean;
  onOpen: (event: PaymentEvent) => void;
}) {
  const tone = getPaymentStatusTone(event.status);

  return (
    <Button
      className={cn(
        'block h-auto w-full rounded-lg border px-2 py-1.5 text-left font-normal whitespace-normal transition-colors hover:bg-transparent hover:text-inherit',
        'border-(--sm-border) hover:border-(--sm-coral-b)',
        TONE_SURFACE[tone],
        // Settled history recedes; work still ahead keeps full contrast.
        event.timeframe === 'past' && event.status === 'paid' && 'opacity-70',
        expanded && 'px-3 py-2.5',
        className
      )}
      onClick={() => onOpen(event)}
      title={`${event.customerName} · ${event.amount} ${event.currencyCode}`}
      type="button"
      variant="ghost"
    >
      <span className="flex items-center gap-1.5">
        <CreditCard aria-hidden="true" className="size-3 shrink-0 opacity-70" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-(--sm-fg)">
          {event.customerName}
        </span>
      </span>
      <span className={cn('mt-0.5 flex items-center gap-1.5', expanded && 'mt-1')}>
        <span className="text-[11px] font-medium text-(--sm-fg) tabular-nums">
          {event.amount} {event.currencyCode}
        </span>
        <StatusBadge className="ml-auto" tone={tone}>
          {formatPaymentStatus(event.status)}
        </StatusBadge>
      </span>
      {expanded ? (
        <span className="mt-1 block text-[11px] text-(--sm-muted)">{event.businessId}</span>
      ) : null}
    </Button>
  );
}

const TONE_SURFACE = {
  caution: 'border-(--sm-gold-b) bg-(--sm-gold-s)',
  critical: 'border-(--sm-coral-b) bg-(--sm-coral-s)',
  neutral: 'border-(--sm-border) bg-(--sm-surface2)',
  positive: 'border-(--sm-emerald-b) bg-(--sm-emerald-s)',
} as const;
