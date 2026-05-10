'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { AccountFormFields } from '@/modules/accounts/client/components/accounts-form-fields';
import {
  accountSchema,
  profileSchema,
  assignSchema,
  type AccountFormInput,
  type ProfileFormInput,
  type AssignForm,
} from '@/modules/accounts/client/components/accounts-types';
import type {
  StreamingAccountDto,
  StreamingProfileDto,
} from '@/lib/graphql/operations/accounts.operations';
import type { ServiceDto } from '@/lib/graphql/operations/services.operations';
import type { SubscriptionDto } from '@/lib/graphql/operations/subscriptions.operations';

// ─── Account Dialog ───────────────────────────────────────────────────────────

interface AccountDialogProps {
  open: boolean;
  acc?: StreamingAccountDto;
  onOpenChange: (open: boolean) => void;
  services: ServiceDto[];
  onSubmit: (data: AccountFormInput) => Promise<void>;
}

export function AccountDialog({ open, acc, onOpenChange, services, onSubmit }: AccountDialogProps) {
  const form = useForm<AccountFormInput>({
    resolver: zodResolver(accountSchema),
    values: {
      serviceId: acc?.serviceId ?? '',
      label: acc?.label ?? '',
      email: acc?.email ?? '',
      phone: acc?.phone ?? '',
      supportsProfiles: acc?.supportsProfiles ?? true,
      maxProfiles: acc?.maxProfiles ?? 1,
      notes: acc?.notes ?? '',
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{acc ? 'Modifier le compte' : 'Nouveau compte streaming'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <AccountFormFields form={form} isEdit={!!acc} services={services} />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Enregistrement…' : acc ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Profile Dialog ───────────────────────────────────────────────────────────

interface ProfileDialogProps {
  open: boolean;
  profile?: StreamingProfileDto;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProfileFormInput) => Promise<void>;
}

export function ProfileDialog({ open, profile, onOpenChange, onSubmit }: ProfileDialogProps) {
  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name ?? '',
      profileIndex: profile?.profileIndex ?? 1,
      pin: profile?.pin ?? '',
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{profile ? 'Modifier le profil' : 'Nouveau profil'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nom du profil *</Label>
            <Input
              placeholder="ex: Profil 1"
              {...form.register('name')}
              error={form.formState.errors.name?.message}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Position dans le compte</Label>
            <Input
              type="number"
              min={1}
              {...form.register('profileIndex')}
              error={form.formState.errors.profileIndex?.message}
            />
            <p className="text-muted-foreground text-xs">
              Numéro d&apos;ordre du profil sur la plateforme (1, 2, 3…)
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>
              Code PIN{' '}
              <span className="text-muted-foreground text-xs font-normal">(chiffré en base)</span>
            </Label>
            <Input
              type="password"
              placeholder="ex: 1234"
              autoComplete="new-password"
              {...form.register('pin')}
            />
          </div>
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

// ─── Assign Dialog ────────────────────────────────────────────────────────────

interface AssignDialogProps {
  open: boolean;
  title?: string;
  subscriptions: SubscriptionDto[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AssignForm) => Promise<void>;
}

export function AssignDialog({
  open,
  title,
  subscriptions,
  onOpenChange,
  onSubmit,
}: AssignDialogProps) {
  const form = useForm<AssignForm>({
    resolver: zodResolver(assignSchema),
    defaultValues: { subscriptionId: '' },
  });

  const hasActiveSubs = subscriptions.some((s) => s.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title ?? 'Assigner à un abonné'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Abonnement actif *</Label>
            <Select onValueChange={(v) => form.setValue('subscriptionId', v)}>
              <SelectTrigger error={form.formState.errors.subscriptionId?.message}>
                <SelectValue placeholder="Choisir un abonnement" />
              </SelectTrigger>
              <SelectContent>
                {subscriptions
                  .filter((s) => s.status === 'active')
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.client?.name ?? s.clientId}
                      {' — '}jusqu&apos;au {s.endDate}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {!hasActiveSubs && (
              <p className="text-muted-foreground text-xs">Aucun abonnement actif trouvé.</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Assigner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
