'use client';
/* eslint-disable react/jsx-max-depth */

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormGroup } from '@/components/ui/form-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
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
import { DatePicker } from '@/components/ui/date-picker';
import type { SubscriptionDto } from '@/lib/graphql/operations/subscriptions.operations';

// ─── Shared types ─────────────────────────────────────────────────────────────

type Status = 'active' | 'expired' | 'paused' | 'cancelled';

export interface UpdateForm {
  status: Status;
  isRecurring: boolean;
  notes?: string;
}

export interface RenewForm {
  startDate: string;
  isRecurring: boolean;
  notes?: string;
}

// ─── Update Dialog ────────────────────────────────────────────────────────────

interface UpdateDialogProps {
  open: boolean;
  sub?: SubscriptionDto;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UpdateForm) => Promise<void>;
}

export function UpdateSubscriptionDialog({ open, sub, onOpenChange, onSubmit }: UpdateDialogProps) {
  const form = useForm<UpdateForm>({
    resolver: zodResolver(
      z.object({
        status: z.enum(['active', 'expired', 'paused', 'cancelled']),
        isRecurring: z.boolean(),
        notes: z.string().optional(),
      })
    ),
    values: {
      status: (sub?.status as Status) ?? 'active',
      isRecurring: sub?.isRecurring ?? false,
      notes: sub?.notes ?? '',
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;abonnement</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup label="Statut" hint="Modifier le statut manuellement si nécessaire">
            <Select
              defaultValue={sub?.status}
              onValueChange={(v) => form.setValue('status', v as Status)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="paused">Suspendu</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </FormGroup>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-1 text-sm font-medium">
                Récurrent
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>
                      Les abonnements récurrents suggèrent un renouvellement à l&apos;expiration
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <p className="text-muted-foreground text-xs">
                Suggérer un renouvellement à l&apos;expiration
              </p>
            </div>
            <Switch
              checked={useWatch({ control: form.control, name: 'isRecurring' })}
              onCheckedChange={(v) => form.setValue('isRecurring', v)}
            />
          </div>
          <FormGroup
            label="Notes"
            hint="Notes internes visibles uniquement par les administrateurs"
          >
            <Textarea rows={2} {...form.register('notes')} />
          </FormGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Renew Dialog ─────────────────────────────────────────────────────────────

interface RenewDialogProps {
  open: boolean;
  sub?: SubscriptionDto;
  planLabel?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RenewForm) => Promise<void>;
}

export function RenewSubscriptionDialog({
  open,
  sub,
  planLabel,
  onOpenChange,
  onSubmit,
}: RenewDialogProps) {
  const form = useForm<RenewForm>({
    resolver: zodResolver(
      z.object({
        startDate: z.string().min(1, 'Date de début requise'),
        isRecurring: z.boolean(),
        notes: z.string().optional(),
      })
    ),
    defaultValues: {
      startDate: new Date().toISOString().slice(0, 10),
      isRecurring: sub?.isRecurring ?? false,
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Renouveler l&apos;abonnement</DialogTitle>
        </DialogHeader>
        {planLabel && (
          <p className="text-muted-foreground text-sm">Formule actuelle : {planLabel}</p>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup
            label="Nouvelle date de début"
            required
            hint="Date à laquelle le nouvel abonnement commence"
            error={form.formState.errors.startDate?.message}
          >
            <DatePicker
              value={useWatch({ control: form.control, name: 'startDate' }) || undefined}
              onChange={(v) => form.setValue('startDate', v ?? '')}
            />
          </FormGroup>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-1 text-sm font-medium">
                Récurrent
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground h-3.5 w-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>
                      Les abonnements récurrents suggèrent un renouvellement à l&apos;expiration
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <p className="text-muted-foreground text-xs">
                Suggérer un renouvellement à l&apos;expiration
              </p>
            </div>
            <Switch
              checked={useWatch({ control: form.control, name: 'isRecurring' })}
              onCheckedChange={(v) => form.setValue('isRecurring', v)}
            />
          </div>
          <FormGroup
            label="Notes"
            hint="Notes internes visibles uniquement par les administrateurs"
          >
            <Textarea rows={2} {...form.register('notes')} />
          </FormGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Renouvellement…' : 'Renouveler'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
