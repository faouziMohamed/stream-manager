"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { WorkflowHint } from "@/components/console/workflow-hint";
import { InfoCallout } from "@/components/console/info-callout";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/console/confirm-dialog";
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
} from "@/lib/hooks/queries/use-accounts.queries";
import { AccountDialog, ProfileDialog, AssignDialog } from "./accounts-dialogs";
import { AccountCard } from "./accounts-card";
import type {
  StreamingAccountDto,
  StreamingProfileDto,
} from "@/lib/graphql/operations/accounts.operations";
import type { ServiceDto } from "@/lib/graphql/operations/services.operations";
import type { SubscriptionDto } from "@/lib/graphql/operations/subscriptions.operations";
import type {
  AccountFormInput,
  ProfileFormInput,
  AssignForm,
} from "./accounts-types";

interface Props {
  initialData?: StreamingAccountDto[];
  services?: ServiceDto[];
  subscriptions?: SubscriptionDto[];
}

export function AccountsEditor({
  initialData,
  services = [],
  subscriptions = [],
}: Props) {
  const { data: accounts = [] } = useStreamingAccounts(undefined, initialData);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();
  const assignProfile = useAssignProfile();
  const removeAssignment = useRemoveAssignment();

  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [accountDialog, setAccountDialog] = useState<{
    open: boolean;
    acc?: StreamingAccountDto;
  }>({ open: false });
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
    type: "account" | "profile";
    id: string;
  } | null>(null);

  // Account handlers
  const onAccountSubmit = async (raw: AccountFormInput) => {
    const data = raw as unknown as {
      serviceId?: string;
      label: string;
      email?: string;
      phone?: string;
      supportsProfiles: boolean;
      maxProfiles: number;
      notes?: string;
    };
    if (accountDialog.acc) {
      await updateAccount.mutateAsync({
        id: accountDialog.acc.id,
        input: {
          label: data.label,
          email: data.email || undefined,
          phone: data.phone || undefined,
          supportsProfiles: data.supportsProfiles,
          maxProfiles: data.supportsProfiles ? data.maxProfiles : 1,
          notes: data.notes || undefined,
        },
      });
    } else {
      await createAccount.mutateAsync({
        serviceId: data.serviceId!,
        label: data.label,
        email: data.email || undefined,
        phone: data.phone || undefined,
        supportsProfiles: data.supportsProfiles,
        maxProfiles: data.supportsProfiles ? data.maxProfiles : 1,
        notes: data.notes || undefined,
      });
    }
    setAccountDialog({ open: false });
  };

  // Profile handlers
  const onProfileSubmit = async (raw: ProfileFormInput) => {
    const data = raw as unknown as {
      name: string;
      profileIndex: number;
      pin?: string;
    };
    if (profileDialog.profile) {
      await updateProfile.mutateAsync({
        id: profileDialog.profile.id,
        input: {
          name: data.name,
          profileIndex: data.profileIndex,
          pin: data.pin || null,
        },
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

  // Assign handlers
  const onAssignSubmit = async (data: AssignForm) => {
    if (!assignDialog.accountId) return;
    await assignProfile.mutateAsync({
      subscriptionId: data.subscriptionId,
      accountId: assignDialog.accountId,
      profileId: assignDialog.profile?.id ?? null,
    });
    setAssignDialog({ open: false });
  };

  const handleRemoveAssignment = async (subscriptionId: string) => {
    await removeAssignment.mutateAsync(subscriptionId);
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "account") {
      await deleteAccount.mutateAsync(deleteTarget.id);
    } else {
      await deleteProfile.mutateAsync(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  // Stats
  const profileAccounts = accounts.filter((a) => a.supportsProfiles);
  const totalSlots = profileAccounts.reduce((s, a) => s + a.maxProfiles, 0);
  const usedSlots = profileAccounts.reduce((s, a) => s + a.usedProfiles, 0);
  const noProfileUsed = accounts
    .filter((a) => !a.supportsProfiles)
    .reduce((s, a) => s + a.usedProfiles, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Comptes streaming</h1>
          <p className="text-muted-foreground text-sm">
            {accounts.length} compte{accounts.length !== 1 ? "s" : ""}
            {totalSlots > 0 && ` · ${usedSlots}/${totalSlots} profils utilisés`}
            {noProfileUsed > 0 &&
              ` · ${noProfileUsed} compte${noProfileUsed !== 1 ? "s" : ""} sans profils assigné${noProfileUsed !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => setAccountDialog({ open: true })}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau compte
        </Button>
      </div>

      <WorkflowHint
        steps={[
          { label: "Services", href: "/console/services" },
          { label: "Abonnements", href: "/console/subscriptions" },
          { label: "Comptes", active: true },
        ]}
      />

      {accounts.length === 0 ? (
        <InfoCallout
          variant="info"
          title="Ajoutez votre premier compte streaming"
        >
          Les comptes streaming représentent les comptes réels que vous gérez
          (Netflix, Disney+, etc.). Associez-le à un service, puis assignez des
          abonnements existants aux profils du compte. Assurez-vous d&apos;avoir
          créé des <strong>services</strong> et des <strong>abonnements</strong>{" "}
          au préalable.
        </InfoCallout>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              subscriptions={subscriptions}
              expanded={expandedAccount === acc.id}
              onToggleExpand={(id) =>
                setExpandedAccount(expandedAccount === id ? null : id)
              }
              onEdit={(a) => setAccountDialog({ open: true, acc: a })}
              onDelete={(id) => setDeleteTarget({ type: "account", id })}
              onAddProfile={(id) =>
                setProfileDialog({ open: true, accountId: id })
              }
              onEditProfile={(id, p) =>
                setProfileDialog({ open: true, accountId: id, profile: p })
              }
              onDeleteProfile={(id) => setDeleteTarget({ type: "profile", id })}
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
              onRemoveAssignment={handleRemoveAssignment}
            />
          ))}
        </div>
      )}

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
        title={
          deleteTarget?.type === "account"
            ? "Supprimer le compte"
            : "Supprimer le profil"
        }
        description={
          deleteTarget?.type === "account"
            ? "Tous les profils et assignations associés seront supprimés."
            : "L'assignation associée sera également supprimée."
        }
        onConfirm={handleDelete}
        loading={deleteAccount.isPending || deleteProfile.isPending}
      />
    </div>
  );
}
