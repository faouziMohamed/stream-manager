'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Repeat, Tag, User } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { FormField } from '@/components/console/shared/form-field';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PrerequisiteOverlay } from '@/components/console/shared/prerequisite-overlay';
import {
  membershipFormSchema,
  toMembershipFormValues,
} from '@/features/memberships/shared/membership-form.schema';
import type { MembershipFormValues } from '@/features/memberships/shared/membership-form.schema';
import type { MembershipsListPayload } from '@/features/memberships/ui/queries/use-memberships.queries';
import { ROUTES } from '@/lib/config/routes';

export function MembershipCreateForm({
  customerOptions,
  isPending,
  onOpenChangeAction,
  onSubmitAction,
  open,
  planOptions,
}: MembershipCreateFormProps) {
  const form = useForm<MembershipFormValues>({
    defaultValues: toMembershipFormValues(),
    resolver: zodResolver(membershipFormSchema),
  });
  const selectedPlanId = useWatch({ control: form.control, name: 'planId' });
  const selectedPlan = planOptions.find((plan) => plan.id === selectedPlanId);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) form.reset(toMembershipFormValues());
    onOpenChangeAction(nextOpen);
  }

  const missingReqs = [
    ...(planOptions.length === 0
      ? [{ label: 'Create a plan first', href: ROUTES.console.plans }]
      : []),
    ...(customerOptions.length === 0
      ? [{ label: 'Add a customer first', href: ROUTES.console.customers }]
      : []),
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        {missingReqs.length > 0 && (
          <PrerequisiteOverlay
            title="Prerequisites missing"
            description="A membership requires at least one active plan and one active customer."
            requirements={missingReqs}
            onCloseAction={() => handleOpenChange(false)}
          />
        )}

        <DialogHeader>
          <DialogTitle>Create membership</DialogTitle>
          <DialogDescription>
            Start a customer plan. The API computes the end date and creates the first unpaid
            payment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmitAction, handleInvalid)}>
          <DialogBody className="space-y-4">
            <Controller
              control={form.control}
              name="customerId"
              render={({ field, fieldState }) => {
                const selectedCustomer = customerOptions.find((c) => c.id === field.value) ?? null;
                return (
                  <FormField label="Customer" error={fieldState.error?.message}>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger icon={User}>
                        <SelectValue placeholder="Select an active customer">
                          {selectedCustomer === null ? null : selectedCustomer.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {customerOptions.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                );
              }}
            />

            <Controller
              control={form.control}
              name="planId"
              render={({ field, fieldState }) => (
                <FormField label="Plan" error={fieldState.error?.message}>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger icon={Tag}>
                      <SelectValue placeholder="Select an active plan">
                        {selectedPlan === undefined
                          ? null
                          : `${selectedPlan.name} · ${selectedPlan.durationMonths} mo · ${selectedPlan.price} ${selectedPlan.currencyCode}`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {planOptions.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} · {plan.durationMonths} mo · {plan.price} {plan.currencyCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />

            <Controller
              control={form.control}
              name="startDate"
              render={({ field, fieldState }) => (
                <FormField label="Start date" error={fieldState.error?.message}>
                  <DatePicker
                    ariaLabel="Start date"
                    error={fieldState.error?.message}
                    onChange={field.onChange}
                    value={field.value}
                  />
                </FormField>
              )}
            />

            <Controller
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormField label="Renewal behavior">
                  <Select
                    value={field.value ? 'recurring' : 'one-time'}
                    onValueChange={(value) => field.onChange(value === 'recurring')}
                  >
                    <SelectTrigger icon={Repeat}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">Manual renewal</SelectItem>
                      <SelectItem value="recurring">Recurring membership</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
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
              {isPending ? 'Creating...' : 'Create membership'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type MembershipCreateFormProps = {
  customerOptions: MembershipsListPayload['customers'];
  isPending: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSubmitAction: (values: MembershipFormValues) => void;
  open: boolean;
  planOptions: MembershipsListPayload['plans'];
};

function handleInvalid() {}
