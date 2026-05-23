'use client';

import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Pencil, Trash2, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/helpers';
import { statusColors, statusLabels } from '@/modules/accounts/client/components/accounts-types';
import {
  getAvatarColor,
  getClientTextColor,
  getInitials,
} from '@/modules/accounts/client/components/accounts-card';
import type { StreamingProfileDto } from '@/lib/graphql/operations/accounts.operations';

interface ProfileRowProps {
  accountId: string;
  profile: StreamingProfileDto;
  onAssign: (profile: StreamingProfileDto) => void;
  onEdit: (profile: StreamingProfileDto) => void;
  onDelete: (profileId: string) => void;
  onRemoveAssignment: (subscriptionId: string) => void;
}

export function ProfileRow({
  profile,
  onAssign,
  onEdit,
  onDelete,
  onRemoveAssignment,
}: ProfileRowProps) {
  const [showPin, setShowPin] = useState(false);
  const assignment = profile.assignment;
  const sub = assignment?.subscription;
  const clientName = sub?.client?.name;
  const isAssigned = Boolean(clientName);

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        isAssigned ? 'border-border bg-card' : 'bg-muted/30 border-transparent'
      )}
    >
      {/* ── Profile identity row ── */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {/* Avatar */}
        <div
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold',
            isAssigned
              ? getAvatarColor(clientName ?? '')
              : 'bg-muted-foreground/15 text-muted-foreground'
          )}
        >
          {getInitials(clientName ?? profile.name)}
        </div>

        {/* Name + index + PIN */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="text-sm font-medium">{profile.name}</span>
          <span className="text-muted-foreground text-xs">#{profile.profileIndex}</span>
          {profile.pin && (
            <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
              <span className="font-mono">PIN: {showPin ? profile.pin : '••••'}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => setShowPin((p) => !p)}
              >
                {showPin ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
              </Button>
            </span>
          )}
        </div>

        {/* Edit / Delete */}
        <div className="flex shrink-0 gap-0.5">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(profile)}>
            <Pencil className="h-3 w-3" />
            <span className="sr-only">Modifier</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive h-6 w-6"
            onClick={() => onDelete(profile.id)}
          >
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Supprimer</span>
          </Button>
        </div>
      </div>

      {/* ── Assignment row (always visible, prominent) ── */}
      {sub && assignment ? (
        <div className="border-t px-3 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <ArrowRight className="text-muted-foreground h-3 w-3 shrink-0" />
              <span className={cn('text-xs font-semibold', getClientTextColor(clientName ?? ''))}>
                {clientName ?? 'Client inconnu'}
              </span>
              <span className={cn('text-[10px] font-medium', statusColors[sub.status])}>
                · {statusLabels[sub.status]} · exp. {sub.endDate}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive h-5 gap-0.5 px-1.5 text-[10px]"
              onClick={() => onRemoveAssignment(assignment.subscriptionId)}
            >
              <UserMinus className="h-2.5 w-2.5" />
              Libérer
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t px-3 py-1.5">
          <button
            type="button"
            onClick={() => onAssign(profile)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
          >
            <ArrowRight className="h-3 w-3" />
            <span className="italic">Non assigné —</span>
            <span className="font-medium not-italic underline underline-offset-2">
              Assigner un client
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
