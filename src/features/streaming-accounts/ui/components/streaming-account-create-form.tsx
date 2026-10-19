'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Lock, Mail, Monitor, ShieldCheck, Tag, Tv, Users } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { PrerequisiteOverlay } from '@/components/console/shared/prerequisite-overlay';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  streamingAccountFormSchema,
  toStreamingAccountFormValues,
} from '@/features/streaming-accounts/shared/streaming-account-form.schema';
import type { StreamingAccountFormValues } from '@/features/streaming-accounts/shared/streaming-account-form.schema';
import { ROUTES } from '@/lib/config/routes';

export type StreamingAccountServiceOption = {
  category: string;
  id: string;
  name: string;
  supportsProfiles: boolean;
};

type StreamingAccountCreateFormProps = {
  isPending: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSubmitAction: (values: StreamingAccountFormValues) => void;
  open: boolean;
  serviceOptions: StreamingAccountServiceOption[];
};

export function StreamingAccountCreateForm({
  isPending,
  onOpenChangeAction,
  onSubmitAction,
  open,
  serviceOptions,
}: StreamingAccountCreateFormProps) {
  const form = useForm<StreamingAccountFormValues>({
    defaultValues: toStreamingAccountFormValues(),
    resolver: zodResolver(streamingAccountFormSchema),
  });
  const supportsProfiles = form.watch('supportsProfiles');

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) form.reset(toStreamingAccountFormValues());
    onOpenChangeAction(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        {serviceOptions.length === 0 && (
          <PrerequisiteOverlay
            title="No services available"
            description="A streaming account must be linked to an active service. Create a service first."
            requirements={[{ label: 'Go to Services', href: ROUTES.console.services }]}
            onCloseAction={() => handleOpenChange(false)}
          />
        )}

        <DialogHeader>
          <span className="mb-1 inline-flex size-11 items-center justify-center rounded-xl border border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral-t)">
            <Tv className="size-5" />
          </span>
          <DialogTitle className="text-xl">Add streaming account</DialogTitle>
          <DialogDescription>
            Add reseller-owned credentials and define the profile capacity available for
            assignments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmitAction, handleInvalid)}>
          <DialogBody className="max-h-[60vh] space-y-4 overflow-y-auto">
            <Controller
              control={form.control}
              name="serviceId"
              render={({ field, fieldState }) => {
                const selectedService = serviceOptions.find((s) => s.id === field.value) ?? null;
                return (
                  <FormField label="Service" error={fieldState.error?.message}>
                    <Select
                      value={field.value}
                      onValueChange={(serviceId) => {
                        field.onChange(serviceId);
                        const service = serviceOptions.find((option) => option.id === serviceId);
                        form.setValue('supportsProfiles', service?.supportsProfiles ?? false);
                      }}
                    >
                      <SelectTrigger
                        icon={Monitor}
                        className="h-10 w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select an active service">
                          {selectedService === null
                            ? null
                            : `${selectedService.name} · ${selectedService.category}`}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {serviceOptions.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} · {service.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                );
              }}
            />

            <FormField label="Inventory label" error={form.formState.errors.label?.message}>
              <Input
                icon={Tag}
                error={form.formState.errors.label?.message}
                placeholder="e.g. Netflix household 03"
                {...form.register('label')}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Login email" error={form.formState.errors.email?.message}>
                <Input
                  icon={Mail}
                  type="email"
                  error={form.formState.errors.email?.message}
                  placeholder="account@example.com"
                  {...form.register('email')}
                />
              </FormField>
              <FormField label="Password" error={form.formState.errors.password?.message}>
                <Input
                  icon={Lock}
                  type="password"
                  error={form.formState.errors.password?.message}
                  placeholder="Optional credential"
                  {...form.register('password')}
                />
              </FormField>
            </div>

            <div className="rounded-xl border border-(--sm-border) bg-(--sm-bg) p-4">
              <div className="mb-4 flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-(--sm-coral)" />
                <div>
                  <p className="text-sm font-semibold text-(--sm-fg)">Assignment capacity</p>
                  <p className="mt-1 text-xs text-(--sm-muted)">
                    Enable profiles when memberships should receive individual profile access.
                  </p>
                </div>
              </div>
              <Controller
                control={form.control}
                name="supportsProfiles"
                render={({ field }) => (
                  <div className="flex items-center justify-between gap-4">
                    <Label>Supports profiles</Label>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) form.setValue('maxProfiles', 1);
                      }}
                    />
                  </div>
                )}
              />
              {supportsProfiles ? (
                <div className="mt-4 grid gap-2">
                  <Label htmlFor="max-profiles">Maximum profiles</Label>
                  <Input
                    icon={Users}
                    id="max-profiles"
                    type="number"
                    min={1}
                    max={100}
                    error={form.formState.errors.maxProfiles?.message}
                    {...form.register('maxProfiles', { valueAsNumber: true })}
                  />
                  {form.formState.errors.maxProfiles === undefined ? null : (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.maxProfiles.message}
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-(--sm-border) px-3 py-2 text-xs text-(--sm-muted)">
              <KeyRound className="size-3.5 text-(--sm-coral)" />
              Credentials are sent through the authenticated BFF and stored server-side.
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
              disabled={isPending || serviceOptions.length === 0}
              variant="accent"
            >
              {isPending ? 'Creating...' : 'Create account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function handleInvalid() {}
