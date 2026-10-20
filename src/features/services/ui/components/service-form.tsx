'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Layers3, LayoutGrid, Tag, Type } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

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
import { ImagePicker } from '@/components/shared/image-picker';
import { RichTextEditor } from '@/components/shared/rich-text/rich-text-editor';
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
  serviceFormSchema,
  toServiceFormValues,
} from '@/features/services/shared/service-form.schema';
import type { ServiceFormValues } from '@/features/services/shared/service-form.schema';

export function ServiceForm({
  isPending = false,
  onOpenChangeAction,
  onSubmitAction,
  open,
  service,
}: ServiceFormProps) {
  const isEdit = service !== undefined;
  const form = useForm<ServiceFormValues>({
    defaultValues: toServiceFormValues(service),
    resolver: zodResolver(serviceFormSchema),
  });
  const imagePreviewUrl = useWatch({ control: form.control, name: 'imageUrl' });

  // Populate inputs with the selected service whenever the dialog opens
  // (defaultValues only apply on mount; the edit dialog is a persistent instance).
  useEffect(() => {
    if (open) {
      form.reset(toServiceFormValues(service));
    }
  }, [open, service, form]);

  function handleOpenChange(nextOpen: boolean) {
    form.reset(toServiceFormValues(service));
    onOpenChangeAction(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <span className="mb-1 inline-flex size-11 items-center justify-center rounded-xl border border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral-t)">
            <Layers3 className="size-5" />
          </span>
          <DialogTitle className="text-xl">
            {isEdit ? 'Edit service' : 'Create a service'}
          </DialogTitle>
          <DialogDescription>
            Define how this service behaves across plans, accounts, and customer assignments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmitAction, handleInvalid)}>
          <DialogBody className="space-y-5">
            <div className="rounded-xl border border-(--sm-border) bg-(--sm-bg) p-4">
              <div className="flex items-start gap-3">
                <Tag className="mt-0.5 size-4 shrink-0 text-(--sm-coral)" />
                <div>
                  <p className="text-sm font-semibold text-(--sm-fg)">Catalog identity</p>
                  <p className="mt-1 text-xs leading-5 text-(--sm-muted)">
                    Use the customer-facing brand name. Category and profile support guide later
                    setup choices.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service-name">
                Service name <span className="text-(--sm-coral)">*</span>
              </Label>
              <Input
                icon={Type}
                id="service-name"
                error={form.formState.errors.name?.message}
                placeholder="e.g. Netflix"
                {...form.register('name')}
              />
              {form.formState.errors.name === undefined ? null : (
                <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Logo / image</Label>
              <Controller
                control={form.control}
                name="imageKey"
                render={({ field }) => (
                  <ImagePicker
                    previewUrl={imagePreviewUrl ?? null}
                    category="SERVICES"
                    disabled={isPending}
                    onChangeAction={(value) => {
                      field.onChange(value === null ? null : value.key);
                      form.setValue('imageUrl', value === null ? null : value.url);
                    }}
                  />
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Controller
                control={form.control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    ariaLabel="Service description"
                    preset="full"
                    placeholder="Describe this service for your team and catalog…"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {form.formState.errors.description === undefined ? null : (
                <p className="text-destructive text-xs">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <Controller
              control={form.control}
              name="category"
              render={({ field, fieldState }) => (
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      icon={LayoutGrid}
                      aria-invalid={fieldState.error === undefined ? undefined : true}
                      className="h-10 w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video streaming</SelectItem>
                      <SelectItem value="music">Music streaming</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="other">Other service</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.error === undefined ? null : (
                    <p className="text-destructive text-xs">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="supportsProfiles"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-(--sm-border) bg-(--sm-bg) p-4">
                  <div>
                    <Label>Individual profiles</Label>
                    <p className="mt-1 text-xs leading-5 text-(--sm-muted)">
                      Enable profile-level assignments for streaming accounts.
                    </p>
                  </div>
                  <Switch
                    aria-label="Toggle individual profiles"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
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

type ServiceFormSeed = {
  category: string;
  descriptionContent?: unknown;
  imageKey?: string | null;
  imageUrl?: string | null;
  name: string;
  supportsProfiles: boolean;
};

type ServiceFormProps = {
  isPending?: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSubmitAction: (values: ServiceFormValues) => void;
  open: boolean;
  service?: ServiceFormSeed;
};

function getSubmitLabel(isEdit: boolean, isPending: boolean) {
  if (isPending) return 'Saving...';
  return isEdit ? 'Save changes' : 'Create service';
}

function handleInvalid() {
  // Errors render inline; this handler only stops an invalid submission.
}
