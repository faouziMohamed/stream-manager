'use client';

import { useState } from 'react';
import { MonitorPlay, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/console/confirm-dialog';
import {
  AccountsStats,
  EmptyState,
  FilterPill,
} from '@/modules/accounts/client/components/accounts-editor-parts';
import {
  useAssignProfile,
  useCreateAccount,
  useCreateProfile,
  useDeleteAccount,
  useDeleteProfile,
  useRemoveAssignment,
  useStreamingAccounts,
  useUpdateAccount,
  useUpdateProfile,
} from '@/lib/hooks/queries/use-accounts.queries';
import {
  AccountDialog,
  ProfileDialog,
  AssignDialog,
} from '@/modules/accounts/client/components/accounts-dialogs';
import { AccountCard } from '@/modules/accounts/client/components/accounts-card';
import type {
  StreamingAccountDto,
  StreamingProfileDto,
} from '@/lib/graphql/operations/accounts.operations';
import type { ServiceDto } from '@/lib/graphql/operations/services.operations';
import type { SubscriptionDto } from '@/lib/graphql/operations/subscriptions.operations';
import type {
  AccountFormInput,
  AssignForm,
  ProfileFormInput,
} from '@/modules/accounts/client/components/accounts-types';

interface Props {
  initialData?: StreamingAccountDto[];
  services?: ServiceDto[];
  subscriptions?: SubscriptionDto[];
}

export function AccountsEditor({ initialData, services = [], subscriptions = [] }: Props) {
  const { data: accounts = [] } = useStreamingAccounts(undefined, initialData);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();
  const assignProfile = useAssignProfile();
  const removeAssignment = useRemoveAssignment();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [accountDialog, setAccountDialog] = useState<{ open: boolean; acc?: StreamingAccountDto }>({
    open: false,
  });
  const [profileDialog, setProfileDialog] = useState<{
    open: boolean;
    accountId?: string;
    profile?: StreamingProfileDto;
  }>({ open: false });
  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    accountId?: string;
    profile?: StreamingProfileDto | null;
    title?: string;
  }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'account' | 'profile';
    id: string;
  } | null>(null);

  const onAccountSubmit = async (raw: AccountFormInput) => {
    const data = raw as unknown as {
      serviceId?: string;
      label: string;
      email?: string;
      phone?: string;
      supportsProfiles: boolean;
      maxProfiles: number;
      notes?: unknown;
    };
    await (accountDialog.acc
      ? updateAccount.mutateAsync({
          id: accountDialog.acc.id,
          input: {
            label: data.label,
            email: data.email || undefined,
            phone: data.phone || undefined,
            supportsProfiles: data.supportsProfiles,
            maxProfiles: data.supportsProfiles ? data.maxProfiles : 1,
            notes: data.notes || undefined,
          },
        })
      : createAccount.mutateAsync({
          serviceId: data.serviceId!,
          label: data.label,
          email: data.email || undefined,
          phone: data.phone || undefined,
          supportsProfiles: data.supportsProfiles,
          maxProfiles: data.supportsProfiles ? data.maxProfiles : 1,
          notes: data.notes || undefined,
        }));
    setAccountDialog({ open: false });
  };

  const onProfileSubmit = async (raw: ProfileFormInput) => {
    const data = raw as unknown as { name: string; profileIndex: number; pin?: string };
    if (profileDialog.profile) {
      await updateProfile.mutateAsync({
        id: profileDialog.profile.id,
        input: { name: data.name, profileIndex: data.profileIndex, pin: data.pin || null },
      });
    } else if (profileDialog.accountId) {
      await createProfile.mutateAsync({
        accountId: profileDialog.accountId,
        name: data.name,
        profileIndex: data.profileIndex,
        pin: data.pin || undefined,
      });
    }
    setProfileDialog({ open: false });
  };

  const onAssignSubmit = async (data: AssignForm) => {
    if (!assignDialog.accountId) return;
    await assignProfile.mutateAsync({
      subscriptionId: data.subscriptionId,
      accountId: assignDialog.accountId,
      profileId: assignDialog.profile?.id ?? null,
    });
    setAssignDialog({ open: false });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await (deleteTarget.type === 'account'
      ? deleteAccount.mutateAsync(deleteTarget.id)
      : deleteProfile.mutateAsync(deleteTarget.id));
    setDeleteTarget(null);
  };

  const profileAccounts = accounts.filter((a) => a.supportsProfiles);
  const totalSlots = profileAccounts.reduce((s, a) => s + a.maxProfiles, 0);
  const usedSlots = profileAccounts.reduce((s, a) => s + a.usedProfiles, 0);
  const totalAssigned = accounts.reduce((s, a) => s + a.usedProfiles, 0);

  const usedServiceIds = new Set(accounts.map((a) => a.serviceId));
  const activeServices = services.filter((s) => usedServiceIds.has(s.id));
  const filteredAccounts = selectedServiceId
    ? accounts.filter((a) => a.serviceId === selectedServiceId)
    : accounts;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <MonitorPlay className="text-primary h-4 w-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Comptes streaming</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Gérez vos comptes et assignez des abonnements aux profils clients.
          </p>
        </div>
        <Button onClick={() => setAccountDialog({ open: true })} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau compte
        </Button>
      </div>

      {/* ── Stats chips ── */}
      {accounts.length > 0 && (
        <AccountsStats
          count={accounts.length}
          totalSlots={totalSlots}
          usedSlots={usedSlots}
          totalAssigned={totalAssigned}
        />
      )}

      {/* ── Service filter pills ── */}
      {activeServices.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <FilterPill
            label="Tous"
            active={selectedServiceId === null}
            onClick={() => setSelectedServiceId(null)}
          />
          {activeServices.map((svc) => (
            <FilterPill
              key={svc.id}
              label={svc.name}
              active={selectedServiceId === svc.id}
              onClick={() => setSelectedServiceId(selectedServiceId === svc.id ? null : svc.id)}
            />
          ))}
        </div>
      )}

      {/* ── Cards grid or empty state ── */}
      {filteredAccounts.length === 0 ? (
        <EmptyState onAdd={() => setAccountDialog({ open: true })} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredAccounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              subscriptions={subscriptions}
              onEdit={(a) => setAccountDialog({ open: true, acc: a })}
              onDelete={(id) => setDeleteTarget({ type: 'account', id })}
              onAddProfile={(id) => setProfileDialog({ open: true, accountId: id })}
              onEditProfile={(id, p) => setProfileDialog({ open: true, accountId: id, profile: p })}
              onDeleteProfile={(id) => setDeleteTarget({ type: 'profile', id })}
              onAssignProfile={(id, p) =>
                setAssignDialog({
                  open: true,
                  accountId: id,
                  profile: p,
                  title: `Assigner le profil « ${p.name} »`,
                })
              }
              onAssignAccount={(a) =>
                setAssignDialog({
                  open: true,
                  accountId: a.id,
                  profile: null,
                  title: `Assigner le compte « ${a.label} »`,
                })
              }
              onRemoveAssignment={(subId) => removeAssignment.mutateAsync(subId)}
            />
          ))}
        </div>
      )}

      {/* ── Dialogs ── */}
      <AccountDialog
        open={accountDialog.open}
        acc={accountDialog.acc}
        onOpenChange={(o) => setAccountDialog({ open: o })}
        services={services}
        onSubmit={onAccountSubmit}
      />
      <ProfileDialog
        open={profileDialog.open}
        profile={profileDialog.profile}
        onOpenChange={(o) => setProfileDialog({ open: o })}
        onSubmit={onProfileSubmit}
      />
      <AssignDialog
        open={assignDialog.open}
        title={assignDialog.title}
        subscriptions={subscriptions}
        onOpenChange={(o) => setAssignDialog({ open: o })}
        onSubmit={onAssignSubmit}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={deleteTarget?.type === 'account' ? 'Supprimer le compte' : 'Supprimer le profil'}
        description={
          deleteTarget?.type === 'account'
            ? 'Tous les profils et assignations associés seront supprimés définitivement.'
            : "L'assignation du profil sera également supprimée."
        }
        onConfirm={handleDelete}
        loading={deleteAccount.isPending || deleteProfile.isPending}
      />
    </div>
  );
}

