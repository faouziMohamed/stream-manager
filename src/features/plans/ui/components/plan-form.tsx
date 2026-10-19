'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Banknote,
  CalendarRange,
  Coins,
  Layers,
  LayoutGrid,
  Monitor,
  Pencil,
  Type,
} from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

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
import { PrerequisiteOverlay } from '@/components/console/shared/prerequisite-overlay';
import { RichTextEditor } from '@/components/shared/rich-text/rich-text-editor';
import { planFormSchema, toPlanFormValues } from '@/features/plans/shared/plan-form.schema';
import type { PlanFormValues } from '@/features/plans/shared/plan-form.schema';
import { ROUTES } from '@/lib/config/routes';

export const PLAN_TYPE_LABELS = {
  individual: 'Individual',
  shared: 'Shared',
  family: 'Family',
} as const;

type PlanSeed = {
  id: string;
  name: string;
  durationMonths: number;
  price: string;
  currencyCode: string;
  planType: string;
  descriptionContent?: unknown;
  serviceId: string;
  isActive: boolean;
};

type ServiceOption = { id: string; name: string; category: string; isActive: boolean };

type PlanFormProps = {
  isPending: boolean;
  mode: 'create' | 'edit';
  onOpenChangeAction: (open: boolean) => void;
  onSubmitAction: (values: PlanFormValues) => void;
  open: boolean;
  plan?: PlanSeed;
  serviceOptions: ServiceOption[];
};

export function PlanForm({
  isPending,
  mode,
  onOpenChangeAction,
  onSubmitAction,
  open,
  plan,
  serviceOptions,
}: PlanFormProps) {
  const isEdit = mode === 'edit';
  const form = useForm<PlanFormValues>({
    defaultValues: toPlanFormValues(plan),
    resolver: zodResolver(planFormSchema),
  });

  // Populate inputs with the selected plan whenever the dialog opens
  // (defaultValues only apply on mount; this dialog is a persistent instance).
  useEffect(() => {
    if (open) {
      form.reset(toPlanFormValues(plan));
    }
  }, [open, plan, form]);

  function handleOpenChange(nextOpen: boolean) {
    form.reset(toPlanFormValues(plan));
    onOpenChangeAction(nextOpen);
  }

  const blocked = mode === 'create' && serviceOptions.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        {blocked && (
          <PrerequisiteOverlay
            title="No services yet"
            description="Each plan must be linked to a streaming service. Create one first."
            requirements={[{ label: 'Go to Services', href: ROUTES.console.services }]}
            onCloseAction={() => handleOpenChange(false)}
          />
        )}

        <DialogHeader>
          <span className="mb-1 inline-flex size-11 items-center justify-center rounded-xl border border-(--sm-gold-b) bg-(--sm-gold-s) text-(--sm-gold-t)">
            {isEdit ? <Pencil className="size-5" /> : <LayoutGrid className="size-5" />}
          </span>
          <DialogTitle className="text-xl">{isEdit ? 'Edit plan' : 'Create a plan'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update pricing details for this plan.'
              : 'Define a pricing tier for a streaming service.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmitAction, handleInvalid)}>
          <DialogBody className="max-h-[60vh] space-y-4 overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="plan-name">Plan name</Label>
              <Input
                icon={Type}
                id="plan-name"
                placeholder="e.g. Netflix Standard – 3 months"
                error={form.formState.errors.name?.message}
                {...form.register('name')}
              />
              {form.formState.errors.name === undefined ? null : (
                <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Controller
                control={form.control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    ariaLabel="Plan description"
                    preset="compact"
                    placeholder="Describe what this plan includes…"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="planType"
              render={({ field, fieldState }) => (
                <div className="grid gap-2">
                  <Label>Plan type</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      icon={Layers}
                      aria-invalid={fieldState.error === undefined ? undefined : true}
                      className="h-10 w-full"
                    >
                      <SelectValue placeholder="Select plan type">
                        {field.value ? PLAN_TYPE_LABELS[field.value] : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">{PLAN_TYPE_LABELS.individual}</SelectItem>
                      <SelectItem value="shared">{PLAN_TYPE_LABELS.shared}</SelectItem>
                      <SelectItem value="family">{PLAN_TYPE_LABELS.family}</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.error === undefined ? null : (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 grid gap-2">
                <Label htmlFor="plan-duration">Duration (months)</Label>
                <Input
                  icon={CalendarRange}
                  id="plan-duration"
                  type="number"
                  min={1}
                  max={60}
                  placeholder="1"
                  error={form.formState.errors.durationMonths?.message}
                  {...form.register('durationMonths')}
                />
                {form.formState.errors.durationMonths === undefined ? null : (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.durationMonths.message}
                  </p>
                )}
              </div>
              <div className="col-span-1 grid gap-2">
                <Label htmlFor="plan-price">Price</Label>
                <Input
                  icon={Banknote}
                  id="plan-price"
                  placeholder="99.00"
                  error={form.formState.errors.price?.message}
                  {...form.register('price')}
                />
                {form.formState.errors.price === undefined ? null : (
                  <p className="text-destructive text-xs">{form.formState.errors.price.message}</p>
                )}
              </div>
              <div className="col-span-1 grid gap-2">
                <Label htmlFor="plan-currency">Currency</Label>
                <Input
                  icon={Coins}
                  id="plan-currency"
                  placeholder="MAD"
                  maxLength={3}
                  {...form.register('currencyCode')}
                />
              </div>
            </div>

            <Controller
              control={form.control}
              name="serviceId"
              render={({ field, fieldState }) => (
                <div className="grid gap-2">
                  <Label>Service</Label>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger
                      icon={Monitor}
                      aria-invalid={fieldState.error === undefined ? undefined : true}
                      className="h-10 w-full"
                    >
                      <SelectValue placeholder="Select a service">
                        {serviceOptions.find((s) => s.id === field.value)?.name ?? null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {serviceOptions.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error === undefined ? null : (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            {isEdit ? (
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-(--sm-border) bg-(--sm-bg) p-4">
                    <div>
                      <Label>Active</Label>
                      <p className="mt-1 text-xs leading-5 text-(--sm-muted)">
                        Inactive plans cannot be assigned to new memberships.
                      </p>
                    </div>
                    <Switch
                      aria-label="Toggle plan active state"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            ) : null}
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
            <Button type="submit" disabled={isPending} variant="accent">
              {getSubmitLabel(isEdit, isPending)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getSubmitLabel(isEdit: boolean, isPending: boolean) {
  if (isPending) return 'Saving...';
  return isEdit ? 'Save changes' : 'Create plan';
}

function handleInvalid() {}
