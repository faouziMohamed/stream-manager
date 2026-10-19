import type { StatusTone } from '@/components/console/shared/status-badge';
import { parseIsoDate, todayIsoDate } from '@/lib/utils/iso-date';

export const PAYMENT_STATUS_FILTERS = ['all', 'unpaid', 'overdue', 'paid', 'cancelled'] as const;

export type PaymentStatusFilter = (typeof PAYMENT_STATUS_FILTERS)[number];

// Visual urgency of a due date for a payment still awaiting money.
// Paid/cancelled rows are always 'normal' — their due date is history.
export function getDueDateUrgency(status: string, dueDate: string): 'overdue' | 'soon' | 'normal' {
  if (status !== 'unpaid' && status !== 'overdue') return 'normal';

  const due = parseIsoDate(dueDate);
  const today = parseIsoDate(todayIsoDate());
  if (due === undefined || today === undefined) return 'normal';

  const dayMs = 86_400_000;
  const daysUntilDue = Math.round((due.getTime() - today.getTime()) / dayMs);
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'soon';
  return 'normal';
}

export function formatPaymentStatus(status: string): string {
  if (status === 'paid') return 'Paid';
  if (status === 'unpaid') return 'Unpaid';
  if (status === 'overdue') return 'Overdue';
  if (status === 'cancelled') return 'Cancelled';
  return status;
}

export function getPaymentStatusTone(status: string): StatusTone {
  if (status === 'paid') return 'positive';
  if (status === 'unpaid') return 'caution';
  if (status === 'overdue') return 'critical';
  return 'neutral';
}
