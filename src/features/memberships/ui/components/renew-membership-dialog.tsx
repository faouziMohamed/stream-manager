'use client';

import { CalendarRange, Hash, RefreshCw, Wallet } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/console/shared/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { addTermMonths, formatDisplayDate } from '@/lib/utils/iso-date';
import { cn, formatCurrency } from '@/lib/utils';

const TERM_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

/**
 * How far ahead a renewal reaches, and whether the money was taken.
 *
 * The count is terms, not an arbitrary end date: a term is fixed at the plan's
 * duration and the next starts the day after the previous ends, so a free date
 * would overlap or leave a gap. A monthly plan makes a term a month; the
 * preview states both so the two readings cannot drift.
 */
export function RenewMembershipDialog({
  customerName,
  endDate,
  isPending,
  onConfirmAction,
  onOpenChangeAction,
  open,
  plan,
}: RenewMembershipDialogProps) {
  // Mounted only while open, so each renewal starts from one unpaid term
  // without an effect resetting state after render.
  const [terms, setTerms] = useState(1);
  const [markPaid, setMarkPaid] = useState(false);
  // The operator often records money days after it was taken; the date stays
  // editable so the ledger carries the day of payment, not the day of entry.
  const [paidDate, setPaidDate] = useState(today());

  const monthsPerTerm = plan?.durationMonths ?? 1;
  const totalMonths = terms * monthsPerTerm;
  const startDate = nextDay(endDate);
  const endDateAfter = addTermMonths(startDate, totalMonths);
  const total = plan === null ? 0 : Number.parseFloat(plan.price) * terms;

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Renew this membership?</DialogTitle>
          <DialogDescription>
            {customerName} · {plan?.name ?? 'plan'} · {monthsPerTerm} month
            {monthsPerTerm === 1 ? '' : 's'} per term
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <FormField label="Terms to add">
            <Select value={String(terms)} onValueChange={(value) => setTerms(Number(value))}>
              <SelectTrigger icon={Hash}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERM_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} term{option === 1 ? '' : 's'} · {option * monthsPerTerm} month
                    {option * monthsPerTerm === 1 ? '' : 's'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="rounded-xl border border-(--sm-coral-b) bg-(--sm-coral-s) p-4">
            <div className="flex items-start gap-3">
              <CalendarRange className="mt-0.5 size-4 shrink-0 text-(--sm-coral)" />
              <div>
                <p className="text-sm font-semibold text-(--sm-fg)">
                  Covers {formatDisplayDate(startDate) || startDate} →{' '}
                  {formatDisplayDate(endDateAfter) || endDateAfter}
                </p>
                <p className="mt-1 text-xs text-(--sm-muted)">
                  {terms} consecutive term{terms === 1 ? '' : 's'} starting the day after the
                  current membership ends.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-(--sm-border) pt-3">
              <span className="flex items-center gap-1.5 text-xs text-(--sm-muted)">
                <Wallet className="size-3.5" />
                {terms} payment{terms === 1 ? '' : 's'}
              </span>
              <span className="text-sm font-semibold text-(--sm-fg) tabular-nums">
                {plan === null ? '—' : formatCurrency(total, plan.currencyCode)}
              </span>
            </div>
          </div>

          <div
            className={cn(
              'flex items-center justify-between gap-4 rounded-lg border px-4 py-3',
              markPaid ? 'border-(--sm-emerald-b) bg-(--sm-emerald-s)' : 'border-(--sm-border)'
            )}
          >
            <div>
              <p className="text-sm font-medium text-(--sm-fg)">Customer already paid</p>
              <p className="text-xs text-(--sm-muted)">
                Records {terms === 1 ? 'the payment' : `all ${terms} payments`} as settled. Leave it
                off and they stay unpaid in the ledger.
              </p>
            </div>
            <Switch
              aria-label="Customer already paid"
              checked={markPaid}
              onCheckedChange={setMarkPaid}
            />
          </div>

          {markPaid ? (
            <FormField label="Paid date">
              <DatePicker
                ariaLabel="Paid date"
                onChange={setPaidDate}
                placeholder="Pick date"
                value={paidDate}
              />
              <p className="text-xs text-(--sm-muted)">
                Change it when the money was taken earlier and recorded today.
              </p>
            </FormField>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => onOpenChangeAction(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={() =>
              onConfirmAction({ markPaid, paidDate: markPaid ? paidDate : undefined, terms })
            }
            type="button"
            variant="accent"
          >
            <RefreshCw className="size-4" />
            {renewLabel(isPending, markPaid, terms)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function renewLabel(isPending: boolean, markPaid: boolean, terms: number): string {
  if (isPending) return 'Renewing…';
  if (markPaid) return `Renew ${terms} & mark paid`;
  return `Renew ${terms} term${terms === 1 ? '' : 's'}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextDay(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) return value;

  date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 10);
}

type RenewMembershipDialogProps = {
  customerName: string;
  /** The current membership's end date, `YYYY-MM-DD`. */
  endDate: string;
  isPending: boolean;
  onConfirmAction: (input: { markPaid: boolean; paidDate?: string; terms: number }) => void;
  onOpenChangeAction: (open: boolean) => void;
  open: boolean;
  plan: { currencyCode: string; durationMonths: number; name: string; price: string } | null;
};
