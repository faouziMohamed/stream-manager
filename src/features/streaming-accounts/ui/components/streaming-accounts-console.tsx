'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Hash, MonitorPlay, Pencil, Plus, Trash2, Type } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ConfirmActionDialog } from '@/components/console/shared/confirm-action-dialog';
import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import { ConsoleMobileList } from '@/components/console/shared/console-mobile-list';
import { StreamingAccountInventoryCard } from '@/features/streaming-accounts/ui/components/streaming-account-inventory-card';
import {
  ConsoleHeadRow,
  ConsoleRow,
  ConsoleTable,
  ConsoleTd,
  ConsoleTh,
} from '@/components/console/shared/console-table';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  buildStreamingAccountStats,
  type StreamingAccountHolderSource,
  type StreamingAccountStats,
} from '@/features/streaming-accounts/shared/streaming-account-stats.mapper';
import { ROUTES } from '@/lib/config/routes';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';
import { formatDisplayDate } from '@/lib/utils/iso-date';
import { TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { ProfileField } from '@/features/streaming-accounts/ui/components/streaming-account-profile-field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  type StreamingAccountFormValues,
  type StreamingAccountUpdateValues,
  type StreamingAssignmentFormValues,
} from '@/features/streaming-accounts/shared/streaming-account-form.schema';
import {
  streamingProfileSchema,
  type StreamingProfileValues,
} from '@/features/streaming-accounts/shared/streaming-profile.schema';
import {
  DeleteStreamingAccountDialog,
  type DeleteStreamingAccountTarget,
} from '@/features/streaming-accounts/ui/components/delete-streaming-account-dialog';
import { StreamingAccountCard } from '@/features/streaming-accounts/ui/components/streaming-account-card';
import {
  StreamingAccountCreateForm,
  type StreamingAccountServiceOption,
} from '@/features/streaming-accounts/ui/components/streaming-account-create-form';
import { StreamingAccountEditForm } from '@/features/streaming-accounts/ui/components/streaming-account-edit-form';
import {
  StreamingAssignmentForm,
  type StreamingMembershipOption,
} from '@/features/streaming-accounts/ui/components/streaming-assignment-form';
import {
  UnassignProfileDialog,
  type UnassignProfileTarget,
} from '@/features/streaming-accounts/ui/components/unassign-profile-dialog';
import type { StreamingAccountsPayload } from '@/features/streaming-accounts/ui/queries/use-streaming-accounts.queries';
import type { UpdateStreamingProfileMutationVariables } from '@/lib/graphql/generated/graphql';
import {
  useCreateStreamingAccount,
  useDeleteStreamingAccount,
  useStreamingAccounts,
  useUpdateStreamingAccount,
} from '@/features/streaming-accounts/ui/queries/use-streaming-accounts.queries';
import {
  useAssignProfileToMembership,
  useCreateStreamingProfile,
  useDeleteStreamingProfile,
  useUnassignProfile,
  useUpdateStreamingProfile,
} from '@/features/streaming-accounts/ui/queries/use-streaming-profiles.queries';

export function StreamingAccountsConsole({
  canManage,
  focusAccountId,
  initialData,
  membershipOptions,
  serviceOptions,
}: StreamingAccountsConsoleProps) {
  const [accountCreateOpen, setAccountCreateOpen] = useState(false);
  const [deleteProfileTarget, setDeleteProfileTarget] = useState<{
    accountId: string;
    profileId: string;
  } | null>(null);
  const [editAccount, setEditAccount] = useState<StreamingAccountRow>();
  const [deleteTarget, setDeleteTarget] = useState<DeleteStreamingAccountTarget>();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [assignmentAccount, setAssignmentAccount] = useState<StreamingAccountRow>();
  const [unassignTarget, setUnassignTarget] = useState<UnassignProfileTarget>();

  const { data, isFetching } = useStreamingAccounts(initialData);
  const accountMutation = useCreateStreamingAccount();
  const editAccountMutation = useUpdateStreamingAccount();
  const deleteAccountMutation = useDeleteStreamingAccount();
  const assignmentMutation = useAssignProfileToMembership(assignmentAccount?.id ?? '');
  const profileMutation = useCreateStreamingProfile();
  const editProfileMutation = useUpdateStreamingProfile();
  const deleteProfileMutation = useDeleteStreamingProfile();
  const unassignMutation = useUnassignProfile();
  const router = useRouter();

  const visibleRows =
    focusAccountId === undefined
      ? data.items
      : data.items.filter((row) => row.id === focusAccountId);

  const serviceNames = new Map(serviceOptions.map((s) => [s.id, s.name]));
  const membershipsById = new Map(membershipOptions.map((m) => [m.id, m]));
  // One figure per account, from the same mapper the record page uses: how
  // many slots are sold, what the current holders pay, when the next frees up.
  const holderSources = new Map<string, StreamingAccountHolderSource>(
    membershipOptions.map((membership) => [membership.id, membership])
  );
  const statsByAccount = new Map<string, StreamingAccountStats>(
    visibleRows.map((row) => [
      row.id,
      buildStreamingAccountStats({
        maxProfiles: row.maxProfiles,
        membershipsById: holderSources,
        profiles: row.profiles ?? [],
      }),
    ])
  );
  const totalSlots = [...statsByAccount.values()].reduce((sum, stats) => sum + stats.capacity, 0);
  const soldSlots = [...statsByAccount.values()].reduce((sum, stats) => sum + stats.assigned, 0);

  const form = useForm<StreamingProfileValues>({
    defaultValues: { name: '', pin: '' },
    resolver: zodResolver(streamingProfileSchema),
  });

  function handleProfileSheetOpenChange(open: boolean) {
    if (!open) {
      setAccountId(null);
      form.reset({ name: '', pin: '' });
    }
  }

  function submitProfile(values: StreamingProfileValues) {
    if (accountId === null) return;
    profileMutation.mutate(
      { accountId, values },
      {
        onSuccess: (profile) => {
          handleProfileSheetOpenChange(false);
          toast.success('Profile created', { description: profile.name });
        },
      }
    );
  }

  function createAccount(values: StreamingAccountFormValues) {
    accountMutation.mutate(values, {
      onSuccess: (account) => {
        setAccountCreateOpen(false);
        toast.success('Streaming account created', { description: account.label });
      },
    });
  }

  function updateAccount(id: string, values: StreamingAccountUpdateValues) {
    editAccountMutation.mutate(
      { id, values },
      {
        onSuccess: (account) => {
          setEditAccount(undefined);
          toast.success('Account updated', { description: account.label });
        },
      }
    );
  }

  function deleteAccount() {
    if (deleteTarget === undefined) return;
    deleteAccountMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(undefined);
        toast.success('Account deleted');
      },
    });
  }

  function assignProfile(values: StreamingAssignmentFormValues) {
    assignmentMutation.mutate(values, {
      onSuccess: () => {
        setAssignmentAccount(undefined);
        toast.success('Profile assigned to membership');
      },
    });
  }

  function unassignProfile() {
    if (unassignTarget === undefined) return;
    unassignMutation.mutate(unassignTarget, {
      onSuccess: (profile) => {
        setUnassignTarget(undefined);
        toast.success('Profile unassigned', { description: profile.name });
      },
    });
  }

  return (
    <>
      {focusAccountId === undefined ? (
        <section className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-(--sm-muted) tabular-nums">
              {data.total} account{data.total === 1 ? '' : 's'} · {soldSlots} of {totalSlots}{' '}
              profile slots sold · {isFetching ? 'Refreshing…' : 'Updated just now'}
            </p>
            {canManage ? (
              <Button variant="accent" onClick={() => setAccountCreateOpen(true)}>
                <Plus className="size-4" />
                New account
              </Button>
            ) : null}
          </div>

          <div className="hidden md:block">
            <ConsoleTable>
              <TableHeader>
                <ConsoleHeadRow>
                  <ConsoleTh>Account</ConsoleTh>
                  <ConsoleTh>Capacity</ConsoleTh>
                  <ConsoleTh>Per month</ConsoleTh>
                  <ConsoleTh>Next slot free</ConsoleTh>
                  <ConsoleTh className="text-right">Actions</ConsoleTh>
                </ConsoleHeadRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => {
                  const stats = statsByAccount.get(row.id);

                  if (stats === undefined) return null;

                  const free = Math.max(stats.capacity - stats.assigned, 0);
                  const detailHref = ROUTES.console.streamingAccountDetail(row.id);

                  return (
                    <ConsoleRow
                      className="cursor-pointer"
                      key={row.id}
                      onClick={() => router.push(detailHref)}
                    >
                      <ConsoleTd>
                        <Button
                          className="h-auto justify-start p-0 text-sm font-semibold text-(--sm-fg) hover:underline"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(detailHref);
                          }}
                          type="button"
                          variant="link"
                        >
                          {row.label}
                        </Button>
                        <p className="mt-0.5 text-xs text-(--sm-muted)">
                          {serviceNames.get(row.serviceId) ?? 'Service'}
                          {row.email === null ? '' : ` · ${row.email}`}
                        </p>
                      </ConsoleTd>

                      <ConsoleTd>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-(--sm-fg) tabular-nums">
                            {stats.assigned}/{stats.capacity}
                          </span>
                          <StatusBadge tone={free === 0 ? 'critical' : 'positive'}>
                            {free === 0 ? 'Full' : `${free} to sell`}
                          </StatusBadge>
                        </div>
                      </ConsoleTd>

                      <ConsoleTd>
                        <p className="text-sm text-(--sm-fg) tabular-nums">
                          {formatCurrency(
                            stats.monthlyRevenue,
                            stats.currencyCode ?? DEFAULT_CURRENCY
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-(--sm-muted)">
                          {stats.payingCount} paid holder{stats.payingCount === 1 ? '' : 's'}
                        </p>
                      </ConsoleTd>

                      <ConsoleTd>
                        {stats.nextToFree?.endDate === undefined ? (
                          <span className="text-sm text-(--sm-muted)">—</span>
                        ) : (
                          <>
                            <p className="text-sm text-(--sm-fg) tabular-nums">
                              {formatDisplayDate(stats.nextToFree.endDate) ||
                                stats.nextToFree.endDate}
                            </p>
                            <p className="mt-0.5 text-xs text-(--sm-muted)">
                              {stats.nextToFree.customerName}
                            </p>
                          </>
                        )}
                      </ConsoleTd>

                      <ConsoleTd onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {canManage ? (
                            <>
                              <WithTooltip label="Edit account">
                                <Button
                                  aria-label="Edit account"
                                  className="size-8"
                                  onClick={() => setEditAccount(row)}
                                  size="icon"
                                  variant="caution"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                              </WithTooltip>
                              <WithTooltip label="Delete account">
                                <Button
                                  aria-label="Delete account"
                                  className="size-8"
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: row.id,
                                      label: row.label,
                                      profileCount: (row.profiles ?? []).length,
                                    })
                                  }
                                  size="icon"
                                  variant="destructive"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </WithTooltip>
                            </>
                          ) : null}
                        </div>
                      </ConsoleTd>
                    </ConsoleRow>
                  );
                })}

                {visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <ConsoleEmptyState
                        bordered={false}
                        icon={<MonitorPlay className="size-4" />}
                        title="No streaming accounts yet"
                        description="Create one to start assigning profiles to memberships."
                      />
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </ConsoleTable>
          </div>

          <ConsoleMobileList>
            {visibleRows.map((row) => {
              const stats = statsByAccount.get(row.id);

              if (stats === undefined) return null;

              return (
                <StreamingAccountInventoryCard
                  key={row.id}
                  canManage={canManage}
                  onDelete={() =>
                    setDeleteTarget({
                      id: row.id,
                      label: row.label,
                      profileCount: (row.profiles ?? []).length,
                    })
                  }
                  onEdit={() => setEditAccount(row)}
                  onOpen={() => router.push(ROUTES.console.streamingAccountDetail(row.id))}
                  row={row}
                  serviceName={serviceNames.get(row.serviceId) ?? 'Service'}
                  stats={stats}
                />
              );
            })}
            {visibleRows.length === 0 ? (
              <ConsoleEmptyState
                icon={<MonitorPlay className="size-4" />}
                title="No streaming accounts yet"
                description="Create one to start assigning profiles to memberships."
              />
            ) : null}
          </ConsoleMobileList>
        </section>
      ) : (
        <section className="mt-6 grid gap-4">
          {visibleRows.map((row) => (
            <StreamingAccountCard
              canManage={canManage}
              isDetailView
              key={row.id}
              membershipsById={membershipsById}
              onAddProfileAction={setAccountId}
              onAssignAction={setAssignmentAccount}
              onDeleteAction={setDeleteTarget}
              onDeleteProfileAction={(accountId, profileId) =>
                setDeleteProfileTarget({ accountId, profileId })
              }
              onEditAction={setEditAccount}
              onEditProfileAction={(profileId, name) => {
                editProfileMutation.mutate(
                  // No PIN in this action: null would mean "clear the PIN", so
                  // the key is left out entirely.
                  { id: profileId, name } as UpdateStreamingProfileMutationVariables['input'],
                  { onSuccess: () => toast.success('Profile renamed', { description: name }) }
                );
              }}
              onUnassignAction={setUnassignTarget}
              row={row}
              serviceNames={serviceNames}
            />
          ))}
          {visibleRows.length === 0 ? (
            <ConsoleEmptyState
              icon={<MonitorPlay className="size-4" />}
              title="This account is no longer available"
              description="It may have been deleted from another screen."
            />
          ) : null}
        </section>
      )}

      <Sheet open={accountId !== null} onOpenChange={handleProfileSheetOpenChange}>
        <SheetContent className="border-l border-(--sm-border) bg-(--sm-surface) sm:max-w-md">
          <SheetHeader className="border-b border-(--sm-border) p-6">
            <SheetTitle className="text-(--sm-fg)">New streaming profile</SheetTitle>
            <SheetDescription className="text-(--sm-muted)">
              Add a profile slot to this streaming account.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={form.handleSubmit(submitProfile, handleInvalid)}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5"
          >
            <ProfileField label="Profile name" error={form.formState.errors.name?.message}>
              <Input
                icon={Type}
                error={form.formState.errors.name?.message}
                {...form.register('name')}
              />
            </ProfileField>
            <ProfileField label="PIN (optional)" error={form.formState.errors.pin?.message}>
              <Input
                icon={Hash}
                error={form.formState.errors.pin?.message}
                {...form.register('pin')}
              />
            </ProfileField>
            <SheetFooter className="mt-auto border-t border-(--sm-border) px-0 pt-5">
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Creating…' : 'Create profile'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <StreamingAccountCreateForm
        open={accountCreateOpen}
        isPending={accountMutation.isPending}
        serviceOptions={serviceOptions}
        onOpenChangeAction={setAccountCreateOpen}
        onSubmitAction={createAccount}
      />
      <StreamingAccountEditForm
        open={editAccount !== undefined}
        account={editAccount}
        isPending={editAccountMutation.isPending}
        onOpenChangeAction={(open) => {
          if (!open) setEditAccount(undefined);
        }}
        onSubmitAction={updateAccount}
      />
      <DeleteStreamingAccountDialog
        target={deleteTarget}
        isPending={deleteAccountMutation.isPending}
        onOpenChangeAction={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
        onConfirmAction={deleteAccount}
      />
      <StreamingAssignmentForm
        open={assignmentAccount !== undefined}
        accountLabel={assignmentAccount?.label ?? 'this account'}
        availableProfiles={(assignmentAccount?.profiles ?? []).filter((p) => !p.isAssigned)}
        isPending={assignmentMutation.isPending}
        membershipOptions={membershipOptions}
        onOpenChangeAction={(open) => {
          if (!open) setAssignmentAccount(undefined);
        }}
        onSubmitAction={assignProfile}
      />
      <UnassignProfileDialog
        target={unassignTarget}
        isPending={unassignMutation.isPending}
        onOpenChangeAction={(open) => {
          if (!open) setUnassignTarget(undefined);
        }}
        onConfirmAction={unassignProfile}
      />

      <ConfirmActionDialog
        cancelLabel="Keep profile"
        confirmLabel="Delete profile"
        description="The profile will be removed from this account and any assignment using it will be unlinked."
        icon={<Trash2 className="size-5" />}
        onConfirm={() => {
          if (deleteProfileTarget === null) return;
          deleteProfileMutation.mutate(deleteProfileTarget, {
            onSuccess: () => toast.success('Profile deleted'),
          });
          setDeleteProfileTarget(null);
        }}
        onOpenChangeAction={(open) => {
          if (!open) setDeleteProfileTarget(null);
        }}
        open={deleteProfileTarget !== null}
        pending={deleteProfileMutation.isPending}
        title="Delete this profile?"
        tone="destructive"
      />
    </>
  );
}

type StreamingAccountRow = StreamingAccountsPayload['items'][number];

type StreamingAccountsConsoleProps = {
  /** Account and profile mutations are admin-only. */
  canManage: boolean;
  /**
   * When set, the console manages a single account: the inventory header and
   * the other cards are hidden. Used by the account detail page so every
   * action lives in one place instead of being duplicated per screen.
   */
  focusAccountId?: string;
  initialData: StreamingAccountsPayload;
  membershipOptions: StreamingMembershipOption[];
  serviceOptions: StreamingAccountServiceOption[];
};

function handleInvalid() {
  // Errors render inline; this handler only stops an invalid submission.
}
