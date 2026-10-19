'use client';

import { LogOut } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { AuthRole } from '@/lib/auth/auth.types';
import { signOutWithApiLogout } from '@/lib/auth/auth-signout';
import { ROUTES } from '@/lib/config/routes';
import { TopbarBreadcrumb } from '@/components/console/layout/topbar-breadcrumb';
import { ThemeDropdown } from '@/components/shared/theme/theme-dropdown';
import { cn } from '@/lib/utils';

export function Topbar({ userName, userRole }: TopbarProps) {
  const initials = getInitials(userName);
  const roleLabel = userRole ?? 'user';
  const roleBadgeClassName = getRoleBadgeClassName(roleLabel);
  const roleDescription = getRoleDescription(roleLabel);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-(--sm-border) bg-(--sm-bg) px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <TopbarBreadcrumb userRole={userRole} />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeDropdown
          iconOnly
          className="size-10.5 rounded-[0.875rem] border border-(--sm-indigo)/40 bg-(--sm-indigo-s) text-(--sm-indigo-t) hover:border-(--sm-indigo)/60 hover:bg-(--sm-indigo-s)"
        />

        <UserMenuDropdown
          initials={initials}
          userName={userName}
          roleLabel={roleLabel}
          roleDescription={roleDescription}
          roleBadgeClassName={roleBadgeClassName}
        />
      </div>
    </header>
  );
}

function UserMenuDropdown({
  initials,
  userName,
  roleLabel,
  roleDescription,
  roleBadgeClassName,
}: UserMenuDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        className="focus-visible:ring-ring inline-flex size-10.5 items-center justify-center rounded-[0.875rem] border border-(--sm-coral-b) bg-(--sm-coral-s) transition-colors hover:border-(--sm-coral)/50 hover:bg-(--sm-coral-s) focus-visible:ring-2 focus-visible:outline-none"
      >
        <Avatar className="size-7 rounded-[0.625rem]">
          <AvatarFallback className="rounded-[0.625rem] bg-(--sm-coral-s) text-xs font-semibold text-(--sm-coral-t)">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-60 rounded-2xl border border-(--sm-border) bg-(--sm-surface) p-2 shadow-[0_18px_48px_var(--sm-card-shadow)]"
      >
        <DropdownMenuGroup>
          <div className="mb-2 rounded-xl border border-(--sm-border) bg-(--sm-surface2) px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-(--sm-fg)">
              {userName ?? 'Unknown user'}
            </p>
            <p className="mt-0.5 truncate text-xs text-(--sm-muted)">{roleDescription}</p>
          </div>

          <div className="mb-2 px-1">
            <Badge
              className={cn(
                'rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase',
                roleBadgeClassName
              )}
            >
              {roleLabel}
            </Badge>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-(--sm-border)" />

        <DropdownMenuItem
          className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-(--sm-coral-t) focus:bg-(--sm-coral-s) focus:text-(--sm-coral-t)"
          onClick={() => void signOutWithApiLogout({ callbackUrl: ROUTES.auth.login })}
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(userName?: string | null): string {
  if (userName === undefined || userName === null || userName.trim().length === 0) {
    return 'U';
  }

  const parts = userName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2);

  const initials = parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
  return initials.length > 0 ? initials : 'U';
}

function getRoleBadgeClassName(role: string): string {
  if (role === 'admin') {
    return 'border-(--sm-violet)/50 bg-(--sm-violet-s) text-(--sm-violet)';
  }

  if (role === 'accountant') {
    return 'border-(--sm-emerald)/45 bg-(--sm-emerald-s) text-(--sm-emerald)';
  }

  return 'border-(--sm-gold)/50 bg-(--sm-gold-s) text-(--sm-gold)';
}

function getRoleDescription(role: string): string {
  if (role === 'admin') {
    return 'Admin operator';
  }

  if (role === 'accountant') {
    return 'Accounting access';
  }

  return 'Workspace member';
}

type TopbarProps = {
  userName?: string | null;
  userRole?: AuthRole | null;
};

type UserMenuDropdownProps = {
  initials: string;
  userName?: string | null;
  roleLabel: string;
  roleDescription: string;
  roleBadgeClassName: string;
};
