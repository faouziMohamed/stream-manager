'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Link2, UserRoundCheck } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { PrerequisiteOverlay } from '@/components/console/shared/prerequisite-overlay';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  streamingAssignmentFormSchema,
  toStreamingAssignmentFormValues,
} from '@/features/streaming-accounts/shared/streaming-account-form.schema';
import { ROUTES } from '@/lib/config/routes';
import type { StreamingAssignmentFormValues } from '@/features/streaming-accounts/shared/streaming-account-form.schema';

export type StreamingMembershipOption = {
  customerId: string;
  id: string;
  currencyCode?: string;
  customerName?: string;
  /** Last covered day, `YYYY-MM-DD`: when this holder's slot frees up. */
  endDate?: string;
  /** First covered day; with `endDate` it decides whether cover is current. */
  startDate?: string;
  /** The term this one renewed; the chain is followed to the newest term. */
  renewedFromId?: string | null;
  /** The stored lifecycle word; only `cancelled` overrides the dates. */
  status?: string;
  /** A renewal keeps this one subscription alive past its paid term. */
  isRecurring?: boolean;
  /** The plan's price normalised to one month, so accounts compare. */
  monthlyPrice?: number;
  planName?: string;
  businessId?: string;
};
export type StreamingProfileOption = {
  id: string;
  name: string;
};

type StreamingAssignmentFormProps = {
  accountLabel: string;
  availableProfiles: StreamingProfileOption[];
  isPending: boolean;
  membershipOptions: StreamingMembershipOption[];
  onOpenChangeAction: (open: boolean) => void;
  onSubmitAction: (values: StreamingAssignmentFormValues) => void;
  open: boolean;
};

export function StreamingAssignmentForm({
  accountLabel,
  availableProfiles,
  isPending,
  membershipOptions,
  onOpenChangeAction,
  onSubmitAction,
  open,
}: StreamingAssignmentFormProps) {
  const form = useForm<StreamingAssignmentFormValues>({
    defaultValues: toStreamingAssignmentFormValues(),
    resolver: zodResolver(streamingAssignmentFormSchema),
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) form.reset(toStreamingAssignmentFormValues());
    onOpenChangeAction(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {membershipOptions.length === 0 && (
          <PrerequisiteOverlay
            title="No active membership"
            description="A profile can only be assigned to an active membership. Create one first."
            requirements={[
              { label: 'Create a membership first', href: ROUTES.console.memberships },
            ]}
            onCloseAction={() => handleOpenChange(false)}
          />
        )}

        <DialogHeader>
          <span className="mb-1 inline-flex size-11 items-center justify-center rounded-xl border border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral-t)">
            <Link2 className="size-5" />
          </span>
          <DialogTitle className="text-xl">Assign profile</DialogTitle>
          <DialogDescription>
            Connect an available profile from {accountLabel} to an active membership.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmitAction, handleInvalid)}>
          <DialogBody className="space-y-4">
            <Controller
              control={form.control}
              name="profileId"
              render={({ field, fieldState }) => (
                <FormSelect
                  error={fieldState.error?.message}
                  label="Available profile"
                  placeholder="Select a profile"
                  value={field.value}
                  onValueChangeAction={field.onChange}
                  options={availableProfiles.map((profile) => ({
                    label: profile.name,
                    value: profile.id,
                  }))}
                />
              )}
            />
            <Controller
              control={form.control}
              name="membershipId"
              render={({ field, fieldState }) => (
                <FormSelect
                  error={fieldState.error?.message}
                  label="Active membership"
                  placeholder="Select a membership"
                  value={field.value}
                  onValueChangeAction={field.onChange}
                  options={membershipOptions.map((membership) => ({
                    label:
                      membership.customerName === undefined && membership.planName === undefined
                        ? 'Membership'
                        : `${membership.customerName ?? 'Customer'} · ${membership.planName ?? 'Plan'}`,
                    value: membership.id,
                  }))}
                />
              )}
            />

            <div className="flex items-start gap-3 rounded-xl border border-(--sm-border) bg-(--sm-bg) p-4">
              <UserRoundCheck className="mt-0.5 size-4 text-(--sm-coral)" />
              <p className="text-xs leading-5 text-(--sm-muted)">
                Assigned profiles disappear from the available list after the API confirms the
                operation.
              </p>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || availableProfiles.length === 0}
              variant="accent"
            >
              {isPending ? 'Assigning...' : 'Assign profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormSelect({
  error,
  label,
  onValueChangeAction,
  options,
  placeholder,
  value,
}: {
  error?: string;
  label: string;
  onValueChangeAction: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  value: string;
}) {
  const selectedOption = options.find((o) => o.value === value) ?? null;
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue !== null) onValueChangeAction(nextValue);
        }}
      >
        <SelectTrigger
          icon={Link2}
          className="h-10 w-full"
          aria-invalid={error === undefined ? undefined : true}
        >
          <SelectValue placeholder={placeholder}>
            {selectedOption === null ? null : selectedOption.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error === undefined ? null : <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function handleInvalid() {
  // Errors render inline; this handler only stops an invalid submission.
}
