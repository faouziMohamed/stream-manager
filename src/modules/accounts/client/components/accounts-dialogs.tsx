'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'lucide-react';
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
import { AccountFormFields } from '@/modules/accounts/client/components/accounts-form-fields';
import {
  accountSchema,
  assignSchema,
  profileSchema,
  type AccountFormInput,
  type AssignForm,
  type ProfileFormInput,
} from '@/modules/accounts/client/components/accounts-types';
import { SubscriptionCard } from '@/modules/accounts/client/components/accounts-subscription-card';
import type {
  StreamingAccountDto,
  StreamingProfileDto,
} from '@/lib/graphql/operations/accounts.operations';
import type { ServiceDto } from '@/lib/graphql/operations/services.operations';
import type { SubscriptionDto } from '@/lib/graphql/operations/subscriptions.operations';

// ─── AccountDialog ────────────────────────────────────────────────────────────

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

  const submitLabel = acc ? 'Enregistrer' : 'Créer';

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
              {form.formState.isSubmitting ? 'Enregistrement…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── ProfileDialog ────────────────────────────────────────────────────────────

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

// ─── AssignDialog ─────────────────────────────────────────────────────────────

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
  const [selected, setSelected] = useState('');

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');

  const handleSelect = (id: string) => {
    setSelected(id);
    form.setValue('subscriptionId', id, { shouldValidate: true });
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setSelected('');
      form.reset();
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title ?? 'Assigner à un abonné'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {activeSubscriptions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
              <User className="text-muted-foreground h-8 w-8" />
              <p className="text-muted-foreground text-sm">Aucun abonnement actif disponible.</p>
              <p className="text-muted-foreground text-xs">
                Créez d&apos;abord un abonnement actif pour l&apos;assigner ici.
              </p>
            </div>
          ) : (
            <div className="max-h-85 space-y-2 overflow-y-auto pr-1">
              {activeSubscriptions.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  sub={sub}
                  selected={selected === sub.id}
                  onSelect={() => handleSelect(sub.id)}
                />
              ))}
            </div>
          )}

          {form.formState.errors.subscriptionId && (
            <p className="text-destructive text-xs">
              {form.formState.errors.subscriptionId.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !selected}
            >
              {form.formState.isSubmitting ? 'Assignation…' : 'Assigner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

