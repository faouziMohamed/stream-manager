'use client';

import Image from 'next/image';
import { Mail, MoreHorizontal, Pencil, Phone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/helpers';
import {
  ProfilesSection,
  DirectAssignSection,
} from '@/modules/accounts/client/components/accounts-card-sections';
import { RichTextContent } from '@/components/rich-text/rich-text-content';
import type {
  StreamingAccountDto,
  StreamingProfileDto,
} from '@/lib/graphql/operations/accounts.operations';
import type { SubscriptionDto } from '@/lib/graphql/operations/subscriptions.operations';

// ─── Color utilities ──────────────────────────────────────────────────────────

const GRADIENTS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-violet-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-teal-500 to-cyan-600',
  'from-red-500 to-red-600',
  'from-indigo-500 to-indigo-600',
];

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
];

const TEXT_COLORS = [
  'text-blue-700 dark:text-blue-300',
  'text-purple-700 dark:text-purple-300',
  'text-emerald-700 dark:text-emerald-300',
  'text-orange-700 dark:text-orange-300',
  'text-pink-700 dark:text-pink-300',
  'text-teal-700 dark:text-teal-300',
  'text-red-700 dark:text-red-300',
  'text-indigo-700 dark:text-indigo-300',
];

export function colorIndexFromString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (s.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getServiceGradient(name: string): string {
  return GRADIENTS[colorIndexFromString(name) % GRADIENTS.length];
}

export function getAvatarColor(name: string): string {
  return AVATAR_COLORS[colorIndexFromString(name) % AVATAR_COLORS.length];
}

export function getClientTextColor(name: string): string {
  return TEXT_COLORS[colorIndexFromString(name) % TEXT_COLORS.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AccountCardProps {
  account: StreamingAccountDto;
  subscriptions: SubscriptionDto[];
  onEdit: (acc: StreamingAccountDto) => void;
  onDelete: (id: string) => void;
  onAddProfile: (accountId: string) => void;
  onEditProfile: (accountId: string, profile: StreamingProfileDto) => void;
  onDeleteProfile: (profileId: string) => void;
  onAssignProfile: (accountId: string, profile: StreamingProfileDto) => void;
  onAssignAccount: (acc: StreamingAccountDto) => void;
  onRemoveAssignment: (subscriptionId: string) => void;
}

// ─── AccountCard ──────────────────────────────────────────────────────────────

export function AccountCard({
  account,
  onEdit,
  onDelete,
  onAddProfile,
  onEditProfile,
  onDeleteProfile,
  onAssignProfile,
  onAssignAccount,
  onRemoveAssignment,
}: AccountCardProps) {
  const serviceName = account.service?.name ?? account.label;
  const gradient = getServiceGradient(serviceName);
  const isFull = account.supportsProfiles && account.usedProfiles >= account.maxProfiles;

  return (
    <Card className={cn('card-hover overflow-hidden', !account.isActive && 'opacity-60')}>
      <div className={cn('h-1 w-full bg-linear-to-r', gradient)} />

      <CardContent className="p-0">
        {/* ── Header ── */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br text-sm font-bold text-white',
              gradient
            )}
          >
            {account.service?.logoUrl ? (
              <Image
                src={account.service.logoUrl}
                alt={serviceName}
                width={40}
                height={40}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              getInitials(serviceName)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-base font-semibold">{account.label}</span>
              {account.service && (
                <Badge variant="outline" className="text-xs">
                  {account.service.name}
                </Badge>
              )}
              {isFull && (
                <Badge variant="destructive" className="text-xs">
                  Complet
                </Badge>
              )}
              {!account.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inactif
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              {account.email && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Mail className="h-3 w-3" />
                  <span className="font-mono">{account.email}</span>
                </span>
              )}
              {account.phone && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Phone className="h-3 w-3" />
                  <span className="font-mono">{account.phone}</span>
                </span>
              )}
              {!account.email && !account.phone && (
                <span className="text-muted-foreground text-xs italic">Aucune coordonnée</span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(account.id)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator />

        {/* ── Profiles / Assignment ── */}
        {account.supportsProfiles ? (
          <ProfilesSection
            account={account}
            onAddProfile={onAddProfile}
            onEditProfile={onEditProfile}
            onDeleteProfile={onDeleteProfile}
            onAssignProfile={onAssignProfile}
            onRemoveAssignment={onRemoveAssignment}
          />
        ) : (
          <DirectAssignSection
            account={account}
            onAssignAccount={onAssignAccount}
            onRemoveAssignment={onRemoveAssignment}
          />
        )}

        {/* ── Notes ── */}
        {Boolean(account.notes) && (
          <>
            <Separator />
            <div className="px-4 py-3">
              <RichTextContent
                className="text-muted-foreground text-xs italic"
                value={account.notes}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
