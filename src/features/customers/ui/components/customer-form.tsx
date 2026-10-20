'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Languages, Mail, Phone, Type } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { RichTextEditor } from '@/components/shared/rich-text/rich-text-editor';
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
import { customerFormSchema } from '@/features/customers/shared/customer.schema';
import type { CustomerFormValues } from '@/features/customers/shared/customer.schema';

export function CustomerForm({
  open,
  onOpenChangeAction,
  customer,
  onSubmitAction,
  isPending,
  serverError,
}: CustomerFormProps) {
  const isEdit = customer !== undefined;
  const submitLabel = getSubmitLabel(isEdit, isPending === true);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: toSeedFormValues(customer),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset(toSeedFormValues(customer));
    onOpenChangeAction(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit customer' : 'New customer'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the customer's contact details."
              : 'Add a new customer to your workspace.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitAction, handleInvalid)}>
          <DialogBody className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-(--sm-fg)">
                Name <span className="text-(--sm-coral)">*</span>
              </Label>
              <Input
                icon={Type}
                id="name"
                placeholder="e.g. Faouzi Mohamed"
                error={errors.name?.message}
                {...register('name')}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-(--sm-fg)">
                Email
              </Label>
              <Input
                icon={Mail}
                id="email"
                type="email"
                placeholder="customer@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-(--sm-fg)">
                Phone
              </Label>
              <Input
                icon={Phone}
                id="phone"
                type="tel"
                placeholder="+212 6XX XXX XXX"
                error={errors.phone?.message}
                {...register('phone')}
              />
              {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
            </div>

            {/* Bills and receipts are written in this language, so it is a
                property of the customer rather than of the operator's screen. */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-(--sm-fg)">Documents language</Label>
              <Controller
                control={form.control}
                name="language"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger icon={Languages}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-(--sm-muted)">
                Used on this customer&rsquo;s bills and receipts.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-(--sm-fg)">Notes</Label>
              <Controller
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <RichTextEditor
                    ariaLabel="Customer notes"
                    preset="compact"
                    placeholder="Internal notes about this customer…"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.notes && <p className="text-destructive text-xs">{errors.notes.message}</p>}
            </div>

            {serverError !== undefined && (
              <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                {serverError}
              </p>
            )}
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
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type CustomerFormSeed = {
  language?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: unknown;
};

function toSeedFormValues(customer?: CustomerFormSeed): CustomerFormValues {
  return {
    language: customer?.language === 'en' ? 'en' : 'fr',
    name: customer?.name ?? '',
    email: customer?.email ?? undefined,
    phone: customer?.phone ?? undefined,
    notes: customer?.notes ?? undefined,
  };
}

type CustomerFormProps = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  customer?: CustomerFormSeed;
  onSubmitAction: (values: CustomerFormValues) => void;
  isPending?: boolean;
  serverError?: string;
};

function getSubmitLabel(isEdit: boolean, isPending: boolean) {
  if (isPending) return 'Saving…';
  return isEdit ? 'Save changes' : 'Create customer';
}

function handleInvalid() {
  // Errors render inline; this handler only stops an invalid submission.
}
