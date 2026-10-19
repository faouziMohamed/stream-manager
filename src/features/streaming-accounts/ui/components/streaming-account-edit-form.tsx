'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Tag, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';

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
import { Switch } from '@/components/ui/switch';
import {
  streamingAccountUpdateSchema,
  toStreamingAccountUpdateValues,
  type StreamingAccountUpdateValues,
} from '@/features/streaming-accounts/shared/streaming-account-form.schema';

export function StreamingAccountEditForm({
  open,
  account,
  isPending,
  onOpenChangeAction,
  onSubmitAction,
}: StreamingAccountEditFormProps) {
  const form = useForm<StreamingAccountUpdateValues>({
    resolver: zodResolver(streamingAccountUpdateSchema),
    defaultValues: toStreamingAccountUpdateValues({
      email: account?.email,
      label: account?.label,
      maxProfiles: account?.maxProfiles,
      supportsProfiles: account?.supportsProfiles,
    }),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  function handleOpenChange(next: boolean) {
    if (!next)
      reset(
        toStreamingAccountUpdateValues({
          email: account?.email,
          label: account?.label,
          maxProfiles: account?.maxProfiles,
          supportsProfiles: account?.supportsProfiles,
        })
      );
    onOpenChangeAction(next);
  }

  function submit(values: StreamingAccountUpdateValues) {
    if (account === undefined) return;
    onSubmitAction(account.id, values);
  }

  const supportsProfiles = watch('supportsProfiles');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>
          <DialogDescription>
            Update credentials and settings for{' '}
            <span className="font-medium text-(--sm-fg)">{account?.label}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit, handleInvalid)}>
          <DialogBody className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-label" className="text-sm font-medium text-(--sm-fg)">
                Account label <span className="text-(--sm-coral)">*</span>
              </Label>
              <Input
                icon={Tag}
                id="edit-label"
                placeholder="e.g. Netflix Main"
                error={errors.label?.message}
                {...register('label')}
              />
              {errors.label && <p className="text-destructive text-xs">{errors.label.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-email" className="text-sm font-medium text-(--sm-fg)">
                Account email
              </Label>
              <Input
                icon={Mail}
                id="edit-email"
                type="email"
                placeholder="account@service.com"
                error={errors.email?.message}
                {...register('email')}
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-(--sm-border) px-4 py-3">
              <div>
                <p className="text-sm font-medium text-(--sm-fg)">Profile sharing</p>
                <p className="text-xs text-(--sm-muted)">Allow multiple profiles on this account</p>
              </div>
              <Switch
                checked={supportsProfiles ?? false}
                onCheckedChange={(checked) => {
                  setValue('supportsProfiles', checked);
                  if (!checked) setValue('maxProfiles', 1);
                }}
              />
            </div>

            {supportsProfiles ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-max-profiles" className="text-sm font-medium text-(--sm-fg)">
                  Max profiles
                </Label>
                <Input
                  icon={Users}
                  id="edit-max-profiles"
                  type="number"
                  min={1}
                  max={100}
                  error={errors.maxProfiles?.message}
                  {...register('maxProfiles', { valueAsNumber: true })}
                />
                {errors.maxProfiles && (
                  <p className="text-destructive text-xs">{errors.maxProfiles.message}</p>
                )}
              </div>
            ) : null}
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
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type StreamingAccountEditSeed = {
  id: string;
  label: string;
  email: string | null;
  maxProfiles: number;
  supportsProfiles: boolean;
};

type StreamingAccountEditFormProps = {
  open: boolean;
  account: StreamingAccountEditSeed | undefined;
  isPending: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSubmitAction: (id: string, values: StreamingAccountUpdateValues) => void;
};

function handleInvalid() {}
