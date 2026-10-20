'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, CircleDot, Coins, Link2, Wallet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { PrerequisiteOverlay } from '@/components/console/shared/prerequisite-overlay';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { todayIsoDate } from '@/lib/utils/iso-date';
import { ROUTES } from '@/lib/config/routes';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';

export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;

export function RecordPaymentForm({
  open,
  isPending,
  membershipOptions,
  onOpenChangeAction,
  onSubmitAction,
}: RecordPaymentFormProps) {
  const form = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      membershipId: '',
      amount: '',
      currencyCode: DEFAULT_CURRENCY,
      dueDate: today,
      paidDate: today,
      method: 'cash',
      notes: '',
      status: 'paid',
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = form;

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChangeAction(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        {membershipOptions.length === 0 && (
          <PrerequisiteOverlay
            title="No membership to bill"
            description="Every payment is tied to a membership. Create one first."
            requirements={[
              { label: 'Create a membership first', href: ROUTES.console.memberships },
            ]}
            onCloseAction={() => handleOpenChange(false)}
          />
        )}

        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Manually register a payment received outside the automated billing cycle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitAction, handleInvalid)}>
          <DialogBody className="max-h-[60vh] space-y-4 overflow-y-auto">
            <Controller
              control={control}
              name="membershipId"
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-(--sm-fg)">
                    Membership <span className="text-(--sm-coral)">*</span>
                  </Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger icon={Link2} className="h-10 w-full">
                      <SelectValue placeholder="Select membership" />
                    </SelectTrigger>
                    <SelectContent>
                      {membershipOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.membershipId && (
                    <p className="text-destructive text-xs">{errors.membershipId.message}</p>
                  )}
                </div>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount" className="text-sm font-medium text-(--sm-fg)">
                  Amount <span className="text-(--sm-coral)">*</span>
                </Label>
                <Input
                  icon={Banknote}
                  id="amount"
                  placeholder="150.00"
                  error={errors.amount?.message}
                  {...register('amount')}
                />
                {errors.amount && (
                  <p className="text-destructive text-xs">{errors.amount.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currency" className="text-sm font-medium text-(--sm-fg)">
                  Currency
                </Label>
                <Input
                  icon={Coins}
                  id="currency"
                  placeholder="MAD"
                  maxLength={3}
                  error={errors.currencyCode?.message}
                  {...register('currencyCode')}
                />
                {errors.currencyCode && (
                  <p className="text-destructive text-xs">{errors.currencyCode.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={control}
                name="dueDate"
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium text-(--sm-fg)">
                      Due date <span className="text-(--sm-coral)">*</span>
                    </Label>
                    <DatePicker
                      ariaLabel="Due date"
                      error={errors.dueDate?.message}
                      onChange={field.onChange}
                      placeholder="Pick date"
                      value={field.value ?? ''}
                    />
                    {errors.dueDate && (
                      <p className="text-destructive text-xs">{errors.dueDate.message}</p>
                    )}
                  </div>
                )}
              />
              <Controller
                control={control}
                name="paidDate"
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium text-(--sm-fg)">Paid date</Label>
                    <DatePicker
                      ariaLabel="Paid date"
                      clearable
                      onChange={field.onChange}
                      placeholder="Optional"
                      value={field.value ?? ''}
                    />
                  </div>
                )}
              />
            </div>

            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-(--sm-fg)">Payment method</Label>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v || undefined)}
                  >
                    <SelectTrigger icon={Wallet} className="h-10 w-full">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="transfer">Bank transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-(--sm-fg)">Status</Label>
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? 'paid')}>
                    <SelectTrigger icon={CircleDot} className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes" className="text-sm font-medium text-(--sm-fg)">
                Notes
              </Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="e.g. Cash received in person"
                {...register('notes')}
              />
              {errors.notes && <p className="text-destructive text-xs">{errors.notes.message}</p>}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} variant="accent">
              {isPending ? 'Recording…' : 'Record payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const today = todayIsoDate();

const recordPaymentSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 150.00)')
    .refine((v) => Number.parseFloat(v) > 0, 'Amount must be greater than 0'),
  currencyCode: z
    .string()
    .length(3, 'Use a 3-letter currency code (e.g. MAD, USD)')
    .transform((v) => v.toUpperCase())
    .default(DEFAULT_CURRENCY),
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  paidDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
  method: z.enum(['cash', 'transfer', 'other']).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  status: z.enum(['paid', 'unpaid']).default('paid'),
});

type RecordPaymentFormProps = {
  open: boolean;
  isPending: boolean;
  membershipOptions: { id: string; label: string }[];
  onOpenChangeAction: (open: boolean) => void;
  onSubmitAction: (values: RecordPaymentFormValues) => void;
};

function handleInvalid() {
  // Errors render inline; this handler only stops an invalid submission.
}
