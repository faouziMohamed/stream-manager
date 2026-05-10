'use client';

import { useState } from 'react';
import { Eye, EyeOff, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/helpers';
import { statusColors } from '@/modules/accounts/client/components/accounts-types';
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
  const assignment = profile.assignment;
  const sub = assignment?.subscription;
  const [showPin, setShowPin] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {assignment ? (
          <UserCheck className="text-primary h-3.5 w-3.5 shrink-0" />
        ) : (
          <UserX className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        )}
        <span className="font-medium">{profile.name}</span>
        <span className="text-muted-foreground text-xs">#{profile.profileIndex}</span>
        {profile.pin && (
          <span className="text-muted-foreground ml-1 flex items-center gap-1 text-xs">
            PIN :<span className="font-mono">{showPin ? profile.pin : '••••'}</span>
            <button
              type="button"
              onClick={() => setShowPin((p) => !p)}
              className="hover:text-foreground transition-colors"
            >
              {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
          </span>
        )}
      </div>

      {sub ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn('text-xs', statusColors[sub.status])}>
            {sub.client?.name ?? '—'}
          </Badge>
          <span className="text-muted-foreground text-xs">jusqu&apos;au {sub.endDate}</span>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive h-6 px-1.5 text-xs"
            onClick={() => onRemoveAssignment(assignment!.subscriptionId)}
          >
            Libérer
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
          onClick={() => onAssign(profile)}
        >
          Assigner
        </Button>
      )}

      <div className="flex shrink-0 gap-1">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(profile)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive h-6 w-6"
          onClick={() => onDelete(profile.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
