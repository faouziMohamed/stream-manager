'use client';

import { Plus, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/helpers';
import { statusColors, statusLabels } from '@/modules/accounts/client/components/accounts-types';
import { ProfileRow } from '@/modules/accounts/client/components/accounts-profile-row';
import {
  getAvatarColor,
  getInitials,
} from '@/modules/accounts/client/components/accounts-card';
import type {
  StreamingAccountDto,
  StreamingProfileDto,
} from '@/lib/graphql/operations/accounts.operations';

// ─── ProfilesSection ──────────────────────────────────────────────────────────

export function ProfilesSection({
  account,
  onAddProfile,
  onEditProfile,
  onDeleteProfile,
  onAssignProfile,
  onRemoveAssignment,
}: {
  account: StreamingAccountDto;
  onAddProfile: (id: string) => void;
  onEditProfile: (id: string, p: StreamingProfileDto) => void;
  onDeleteProfile: (id: string) => void;
  onAssignProfile: (id: string, p: StreamingProfileDto) => void;
  onRemoveAssignment: (subId: string) => void;
}) {
  const canAdd = account.profiles.length < account.maxProfiles;

  return (
    <div className="px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          Profils{' '}
          <span className="normal-case">
            ({account.usedProfiles}/{account.maxProfiles})
          </span>
        </p>
        {canAdd && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 gap-1 px-2 text-xs"
            onClick={() => onAddProfile(account.id)}
          >
            <Plus className="h-3 w-3" /> Ajouter
          </Button>
        )}
      </div>

      <SlotBar account={account} />

      {account.profiles.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-xs italic">
          Aucun profil — cliquez sur Ajouter pour en créer.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {account.profiles.map((profile) => (
            <ProfileRow
              key={profile.id}
              accountId={account.id}
              profile={profile}
              onAssign={(p) => onAssignProfile(account.id, p)}
              onEdit={(p) => onEditProfile(account.id, p)}
              onDelete={onDeleteProfile}
              onRemoveAssignment={onRemoveAssignment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SlotBar ──────────────────────────────────────────────────────────────────

export function SlotBar({ account }: { account: StreamingAccountDto }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: account.maxProfiles }, (_, i) => {
        const profile = account.profiles[i];
        const clientName = profile?.assignment?.subscription?.client?.name;
        const isAssigned = Boolean(clientName);

        if (!profile) {
          return (
            <div
              key={`empty-${i}`}
              className="border-muted-foreground/20 flex h-7 w-7 items-center justify-center rounded-full border border-dashed"
            >
              <span className="text-muted-foreground/40 text-[8px]">+</span>
            </div>
          );
        }

        const initials = getInitials(clientName ?? profile.name);
        const colorClass = isAssigned
          ? getAvatarColor(clientName ?? '')
          : 'bg-muted text-muted-foreground';

        return (
          <div
            key={profile.id}
            title={isAssigned ? `${profile.name} → ${clientName}` : profile.name}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold',
              colorClass
            )}
          >
            {initials}
          </div>
        );
      })}
    </div>
  );
}

// ─── DirectAssignSection ──────────────────────────────────────────────────────

export function DirectAssignSection({
  account,
  onAssignAccount,
  onRemoveAssignment,
}: {
  account: StreamingAccountDto;
  onAssignAccount: (acc: StreamingAccountDto) => void;
  onRemoveAssignment: (subId: string) => void;
}) {
  const assignment = account.accountAssignment;
  const sub = assignment?.subscription;
  const clientName = sub?.client?.name;

  if (sub && assignment) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold',
              getAvatarColor(clientName ?? '')
            )}
          >
            {getInitials(clientName ?? '?')}
          </div>
          <div>
            <p className="text-sm font-medium">{clientName ?? 'Client inconnu'}</p>
            <p className={cn('text-xs font-medium', statusColors[sub.status])}>
              {statusLabels[sub.status]} · exp. {sub.endDate}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive h-7 px-2 text-xs"
          onClick={() => onRemoveAssignment(assignment.subscriptionId)}
        >
          Libérer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full">
          <UserX className="text-muted-foreground h-3.5 w-3.5" />
        </div>
        <span className="text-muted-foreground text-sm italic">Non assigné</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs"
        onClick={() => onAssignAccount(account)}
      >
        Assigner
      </Button>
    </div>
  );
}


