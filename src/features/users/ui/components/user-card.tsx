'use client';

import { LogOut, ShieldCheck, Trash2 } from 'lucide-react';

import {
  ConsoleMobileActions,
  ConsoleMobileCard,
  ConsoleMobileCardHeader,
} from '@/components/console/shared/console-mobile-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_LABELS, type UserRole } from '@/features/users/shared/user.types';
import type { UserManagementDto } from '@/lib/graphql/generated/graphql.users';

export function UserCard({
  deletePending,
  logoutPending,
  onDelete,
  onLogout,
  onRoleChange,
  role,
  rolePending,
  user,
}: UserCardProps) {
  return (
    <ConsoleMobileCard>
      <ConsoleMobileCardHeader>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg" className="bg-(--sm-surface2)">
            {user.avatar ? <AvatarImage alt={user.name} src={user.avatar} /> : null}
            <AvatarFallback className="bg-(--sm-surface2) text-xs font-semibold text-(--sm-coral)">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-(--sm-fg)">{user.name}</p>
            <p className="truncate text-xs text-(--sm-muted)">{user.email}</p>
          </div>
        </div>
      </ConsoleMobileCardHeader>

      <Select
        disabled={rolePending}
        onValueChange={(value) => {
          const nextRole = value as UserRole;
          if (nextRole === role) return;
          onRoleChange(nextRole);
        }}
        value={role}
      >
        <SelectTrigger className="mt-3 w-full" icon={ShieldCheck}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
          <SelectItem value="accountant">{ROLE_LABELS.accountant}</SelectItem>
          <SelectItem value="user">{ROLE_LABELS.user}</SelectItem>
        </SelectContent>
      </Select>

      <ConsoleMobileActions>
        <Button
          className="text-(--sm-muted) hover:bg-(--sm-gold-s) hover:text-(--sm-gold-t)"
          disabled={logoutPending}
          onClick={onLogout}
          size="sm"
          variant="ghost"
        >
          <LogOut className="size-4" />
          Revoke sessions
        </Button>
        <Button
          className="text-(--sm-muted) hover:bg-(--sm-coral-s) hover:text-(--sm-coral-t)"
          disabled={deletePending}
          onClick={onDelete}
          size="sm"
          variant="ghost"
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </ConsoleMobileActions>
    </ConsoleMobileCard>
  );
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0)?.toUpperCase() ?? '')
    .join('');
}

type UserCardProps = {
  deletePending: boolean;
  logoutPending: boolean;
  onDelete: () => void;
  onLogout: () => void;
  onRoleChange: (role: UserRole) => void;
  role: UserRole;
  rolePending: boolean;
  user: UserManagementDto;
};
