'use client';

import { CalendarDays, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/helpers';
import {
  statusColors,
  statusLabels,
} from '@/modules/accounts/client/components/accounts-types';
import {
  getAvatarColor,
  getInitials,
} from '@/modules/accounts/client/components/accounts-card';
import type { SubscriptionDto } from '@/lib/graphql/operations/subscriptions.operations';

interface SubscriptionCardProps {
  sub: SubscriptionDto;
  selected: boolean;
  onSelect: () => void;
}

export function SubscriptionCard({ sub, selected, onSelect }: SubscriptionCardProps) {
  const clientName = sub.client?.name ?? 'Client inconnu';
  const planLabel =
    sub.plan?.service?.name ?? sub.plan?.promotion?.name ?? sub.plan?.name ?? '—';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
          : 'hover:border-border/80 hover:bg-muted/50'
      )}
    >
      {/* Client avatar */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          getAvatarColor(clientName)
        )}
      >
        {getInitials(clientName)}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{clientName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <CalendarDays className="h-3 w-3" />
            Exp. {sub.endDate}
          </span>
          {planLabel !== '—' && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {planLabel}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn('px-1.5 py-0 text-[10px]', statusColors[sub.status])}
          >
            {statusLabels[sub.status]}
          </Badge>
        </div>
      </div>

      {/* Selection indicator */}
      {selected && <CheckCircle2 className="text-primary h-4 w-4 shrink-0" />}
    </button>
  );
}

