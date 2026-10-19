'use client';

import { Pencil, Trash2 } from 'lucide-react';

import {
  ConsoleMobileActions,
  ConsoleMobileCard,
  ConsoleMobileCardHeader,
  ConsoleMobileFact,
} from '@/components/console/shared/console-mobile-list';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { Button } from '@/components/ui/button';
import type { StreamingAccountStats } from '@/features/streaming-accounts/shared/streaming-account-stats.mapper';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_CURRENCY } from '@/lib/utils/currency';
import { formatDisplayDate } from '@/lib/utils/iso-date';

/** One account in the inventory on a phone: what it sells and what is free. */
export function StreamingAccountInventoryCard({
  canManage,
  onDelete,
  onEdit,
  onOpen,
  row,
  serviceName,
  stats,
}: StreamingAccountInventoryCardProps) {
  const free = Math.max(stats.capacity - stats.assigned, 0);

  return (
    <ConsoleMobileCard onClick={onOpen}>
      <ConsoleMobileCardHeader>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-(--sm-fg)">{row.label}</p>
          <p className="mt-0.5 truncate text-xs text-(--sm-muted)">
            {serviceName}
            {row.email === null ? '' : ` · ${row.email}`}
          </p>
        </div>
        <StatusBadge tone={free === 0 ? 'critical' : 'positive'}>
          {free === 0 ? 'Full' : `${free} to sell`}
        </StatusBadge>
      </ConsoleMobileCardHeader>

      <div className="mt-3 grid gap-1.5">
        <ConsoleMobileFact
          label="Capacity"
          value={
            <span className="font-semibold tabular-nums">
              {stats.assigned}/{stats.capacity}
            </span>
          }
        />
        <ConsoleMobileFact
          label="Per month"
          value={
            <>
              <span className="font-semibold tabular-nums">
                {formatCurrency(stats.monthlyRevenue, stats.currencyCode ?? DEFAULT_CURRENCY)}
              </span>
              <span className="mt-0.5 block text-xs text-(--sm-muted)">
                {stats.payingCount} paid holder{stats.payingCount === 1 ? '' : 's'}
              </span>
            </>
          }
        />
        <ConsoleMobileFact
          label="Next slot free"
          value={
            stats.nextToFree?.endDate === undefined ? (
              <span className="text-(--sm-muted)">—</span>
            ) : (
              <>
                <span className="tabular-nums">
                  {formatDisplayDate(stats.nextToFree.endDate) || stats.nextToFree.endDate}
                </span>
                <span className="mt-0.5 block text-xs text-(--sm-muted)">
                  {stats.nextToFree.customerName}
                </span>
              </>
            )
          }
        />
      </div>

      {canManage ? (
        <ConsoleMobileActions>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            size="sm"
            variant="caution"
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            size="sm"
            variant="destructive"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </ConsoleMobileActions>
      ) : null}
    </ConsoleMobileCard>
  );
}

type StreamingAccountInventoryCardProps = {
  /** Edit and delete are admin mutations. */
  canManage: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onOpen: () => void;
  row: {
    email: string | null;
    id: string;
    label: string;
  };
  serviceName: string;
  stats: StreamingAccountStats;
};
