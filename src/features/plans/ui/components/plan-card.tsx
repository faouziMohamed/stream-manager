'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  ConsoleMobileActions,
  ConsoleMobileCard,
  ConsoleMobileCardHeader,
  ConsoleMobileFact,
} from '@/components/console/shared/console-mobile-list';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { Button } from '@/components/ui/button';
import { PLAN_TYPE_BADGE_CLASSES, PLAN_TYPE_LABELS } from '@/features/plans/ui/components/plan-row';
import { ROUTES } from '@/lib/config/routes';
import type { ListPlansQuery } from '@/lib/graphql/generated/graphql';

type PlanRowData = ListPlansQuery['plans']['items'][number];

export function PlanCard({
  canManage,
  onDeleteAction,
  onEditAction,
  onViewAction,
  row,
  serviceNames,
}: PlanCardProps) {
  const router = useRouter();

  return (
    <ConsoleMobileCard onClick={onViewAction}>
      <ConsoleMobileCardHeader>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-(--sm-fg)">{row.name}</p>
          <span
            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${PLAN_TYPE_BADGE_CLASSES[row.planType] ?? PLAN_TYPE_BADGE_CLASSES.individual}`}
          >
            {PLAN_TYPE_LABELS[row.planType] ?? row.planType}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-sm font-semibold text-(--sm-fg) tabular-nums">
            {row.price} {row.currencyCode}
          </p>
          {row.isActive ? null : <StatusBadge tone="neutral">Inactive</StatusBadge>}
        </div>
      </ConsoleMobileCardHeader>

      <div className="mt-3 grid gap-1.5">
        <ConsoleMobileFact label="Service" value={serviceNames.get(row.serviceId) ?? '—'} />
        <ConsoleMobileFact
          label="Duration"
          value={`${row.durationMonths} ${row.durationMonths === 1 ? 'month' : 'months'}`}
        />
      </div>

      <ConsoleMobileActions>
        <Button
          onClick={(event) => {
            event.stopPropagation();
            router.push(ROUTES.console.planDetail(row.id));
          }}
          size="sm"
          variant="info"
        >
          <Eye className="size-3.5" />
          View
        </Button>
        {canManage ? (
          <>
            <Button
              onClick={(event) => {
                event.stopPropagation();
                onEditAction();
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
                onDeleteAction();
              }}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </>
        ) : null}
      </ConsoleMobileActions>
    </ConsoleMobileCard>
  );
}

type PlanCardProps = {
  /** Edit and delete are admin mutations. */
  canManage: boolean;
  onDeleteAction: () => void;
  onEditAction: () => void;
  /** Opens the summary sheet; View navigates to the record page. */
  onViewAction: () => void;
  row: PlanRowData;
  serviceNames: Map<string, string>;
};
