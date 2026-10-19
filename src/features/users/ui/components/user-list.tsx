'use client';

import { useState } from 'react';
import { LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ConfirmActionDialog } from '@/components/console/shared/confirm-action-dialog';
import { ConsoleMobileList } from '@/components/console/shared/console-mobile-list';
import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { UserCard, getInitials } from '@/features/users/ui/components/user-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROLE_LABELS } from '@/features/users/shared/user.types';
import type { UserRole } from '@/features/users/shared/user.types';
import {
  useDeleteUser,
  useLogoutUserDevices,
  useUpdateUserRole,
  useUsers,
} from '@/features/users/ui/queries/use-users.queries';
import type { UserManagementDto } from '@/lib/graphql/generated/graphql.users';

export function UserList({ initialUsers }: UserListProps) {
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [logoutTarget, setLogoutTarget] = useState<{ id: string; name: string } | null>(null);
  const [roleTarget, setRoleTarget] = useState<{
    id: string;
    name: string;
    role: UserRole;
  } | null>(null);
  const { data: users, isFetching, isError } = useUsers(initialUsers);
  const updateUserRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();
  const logoutUserDevicesMutation = useLogoutUserDevices();

  function handleRoleChange() {
    if (roleTarget === null) return;
    updateUserRoleMutation.mutate({ id: roleTarget.id, role: roleTarget.role });
    setRoleTarget(null);
  }

  function handleDelete() {
    if (!deleteUserId) return;
    deleteUserMutation.mutate(deleteUserId);
    setDeleteUserId(null);
  }

  function handleLogoutAllDevices() {
    if (!logoutTarget) return;
    const { id, name } = logoutTarget;
    logoutUserDevicesMutation.mutate(id, {
      onSuccess: () => {
        setLogoutTarget(null);
        toast.success('All sessions revoked', { description: name });
      },
    });
  }

  const userViews = users.map((user) => ({
    deletePending: deleteUserMutation.isPending && deleteUserMutation.variables === user.id,
    logoutPending:
      logoutUserDevicesMutation.isPending && logoutUserDevicesMutation.variables === user.id,
    role: toUserRole(user.role),
    rolePending:
      updateUserRoleMutation.isPending && updateUserRoleMutation.variables?.id === user.id,
    user,
  }));

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-(--sm-border) bg-(--sm-surface)">
        <div className="flex items-center justify-between border-b border-(--sm-border) bg-(--sm-bg) px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-(--sm-fg)">Access registry</p>
            <p className="text-xs text-(--sm-muted)">
              Roles sync through the API identity contract.
            </p>
          </div>
          <p className="text-xs text-(--sm-muted)">
            {isFetching ? 'Refreshing…' : 'Updated just now'}
          </p>
        </div>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-(--sm-border) bg-(--sm-surface)">
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.16em] text-(--sm-muted) uppercase sm:px-6">
                  User
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.16em] text-(--sm-muted) uppercase sm:px-6">
                  Email
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.16em] text-(--sm-muted) uppercase sm:px-6">
                  Role
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-semibold tracking-[0.16em] text-(--sm-muted) uppercase sm:px-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-destructive px-6 py-10 text-center text-sm"
                  >
                    Users could not be refreshed. The last server snapshot remains available.
                  </TableCell>
                </TableRow>
              ) : null}
              {userViews.map(({ deletePending, logoutPending, role, rolePending, user }) => {
                return (
                  <TableRow key={user.id} className="border-b border-(--sm-border) last:border-b-0">
                    <TableCell className="px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <Avatar size="lg" className="bg-(--sm-surface2)">
                          {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                          <AvatarFallback className="bg-(--sm-surface2) text-xs font-semibold text-(--sm-coral)">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-(--sm-fg)">{user.name}</p>
                          <p className="text-xs text-(--sm-muted)">{ROLE_LABELS[role]}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-(--sm-muted) sm:px-6">
                      {user.email}
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <Select
                        value={role}
                        onValueChange={(value) => {
                          const nextRole = value as UserRole;
                          if (nextRole === role) return;
                          setRoleTarget({ id: user.id, name: user.name, role: nextRole });
                        }}
                        disabled={rolePending}
                      >
                        <SelectTrigger icon={ShieldCheck} className="w-[170px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                          <SelectItem value="accountant">{ROLE_LABELS.accountant}</SelectItem>
                          <SelectItem value="user">{ROLE_LABELS.user}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right sm:px-6">
                      <div className="flex items-center justify-end gap-1">
                        <WithTooltip label={`Revoke all sessions for ${user.name}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLogoutTarget({ id: user.id, name: user.name })}
                            disabled={logoutPending}
                            aria-label={`Revoke all sessions for ${user.name}`}
                            className="text-(--sm-muted) hover:bg-(--sm-gold-s) hover:text-(--sm-gold-t)"
                          >
                            <LogOut className="size-4" />
                          </Button>
                        </WithTooltip>
                        <WithTooltip label={`Delete ${user.name}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteUserId(user.id)}
                            disabled={deletePending}
                            aria-label={`Delete ${user.name}`}
                            className="text-(--sm-muted) hover:bg-(--sm-coral-s) hover:text-(--sm-coral-t)"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </WithTooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-(--sm-muted)"
                  >
                    No users are available from the API yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <ConsoleMobileList className="p-4">
          {isError ? (
            <p className="text-destructive text-sm">
              Users could not be refreshed. The last server snapshot remains available.
            </p>
          ) : null}
          {userViews.map(({ deletePending, logoutPending, role, rolePending, user }) => (
            <UserCard
              key={user.id}
              deletePending={deletePending}
              logoutPending={logoutPending}
              onDelete={() => setDeleteUserId(user.id)}
              onLogout={() => setLogoutTarget({ id: user.id, name: user.name })}
              onRoleChange={(nextRole) =>
                setRoleTarget({ id: user.id, name: user.name, role: nextRole })
              }
              role={role}
              rolePending={rolePending}
              user={user}
            />
          ))}
          {users.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-(--sm-muted)">
              No users are available from the API yet.
            </p>
          ) : null}
        </ConsoleMobileList>
      </div>
      <AlertDialog
        open={deleteUserId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteUserId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-(--sm-coral-s) text-(--sm-coral-t)">
              <ShieldCheck className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={logoutTarget !== null}
        onOpenChange={(open) => {
          if (!open) setLogoutTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-(--sm-gold-s) text-(--sm-gold-t)">
              <LogOut className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Revoke all sessions</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately sign out{' '}
              <span className="font-medium text-(--sm-fg)">{logoutTarget?.name}</span> from all
              devices. They will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutAllDevices}
              className="bg-(--sm-gold) text-(--sm-gold-fg) hover:opacity-90"
            >
              Revoke sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmActionDialog
        confirmLabel="Change role"
        description={
          roleTarget === null
            ? ''
            : `${roleTarget.name} will become ${ROLE_LABELS[roleTarget.role]}. Their access changes on their next request.`
        }
        icon={<ShieldCheck className="size-5" />}
        onConfirm={handleRoleChange}
        onOpenChangeAction={(open) => {
          if (!open) setRoleTarget(null);
        }}
        open={roleTarget !== null}
        pending={updateUserRoleMutation.isPending}
        title="Change this user's role?"
        tone="caution"
      />
    </>
  );
}

type UserListProps = {
  initialUsers: UserManagementDto[];
};

function toUserRole(role: string): UserRole {
  if (role === 'admin' || role === 'accountant' || role === 'user') {
    return role;
  }

  return 'user';
}
