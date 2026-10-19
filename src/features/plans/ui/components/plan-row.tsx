'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ConsoleRow, ConsoleTd } from '@/components/console/shared/console-table';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config/routes';
import type { ListPlansQuery } from '@/lib/graphql/generated/graphql';

/**
 * The row opens the summary sheet; View leaves the table for the record's
 * page. The name is a real button so the sheet stays reachable without a
 * pointer, and the actions cell stops the click from bubbling into the row.
 */
export function PlanRow({
  canManage,
  onDeleteAction,
  onEditAction,
  onViewAction,
  row,
  serviceNames,
}: PlanRowProps) {
  const router = useRouter();
  const ownerName = serviceNames.get(row.serviceId) ?? '—';

  return (
    <ConsoleRow className="cursor-pointer" onClick={onViewAction}>
      <ConsoleTd>
        <div className="flex items-center gap-2">
          <Button
            className="h-auto justify-start p-0 text-sm font-semibold text-(--sm-fg) hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              onViewAction();
            }}
            type="button"
            variant="link"
          >
            {row.name}
          </Button>
          {row.isActive ? null : <StatusBadge tone="neutral">Inactive</StatusBadge>}
        </div>
      </ConsoleTd>
      <ConsoleTd>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${PLAN_TYPE_BADGE_CLASSES[row.planType] ?? PLAN_TYPE_BADGE_CLASSES.individual}`}
        >
          {PLAN_TYPE_LABELS[row.planType] ?? row.planType}
        </span>
      </ConsoleTd>
      <ConsoleTd className="text-sm">
        <span className="text-(--sm-muted)">Service: </span>
        <span className="font-medium text-(--sm-fg)">{ownerName}</span>
      </ConsoleTd>
      <ConsoleTd className="text-sm text-(--sm-muted)">
        {row.durationMonths} {row.durationMonths === 1 ? 'month' : 'months'}
      </ConsoleTd>
      <ConsoleTd className="text-sm font-semibold text-(--sm-fg)">
        {row.price} {row.currencyCode}
      </ConsoleTd>
      <ConsoleTd className="text-right" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => router.push(ROUTES.console.planDetail(row.id))}
            size="sm"
            variant="info"
          >
            <Eye className="size-3.5" />
            View
          </Button>
          {canManage ? (
            <>
              <Button onClick={onEditAction} size="sm" variant="caution">
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button onClick={onDeleteAction} size="sm" variant="destructive">
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </>
          ) : null}
        </div>
      </ConsoleTd>
    </ConsoleRow>
  );
}

type PlanRowData = ListPlansQuery['plans']['items'][number];

export const PLAN_TYPE_LABELS: Record<string, string> = {
  family: 'Family',
  individual: 'Individual',
  shared: 'Shared',
};

/**
 * One documented tone per enumerated value. These are categories, not states,
 * but telling them apart is the job of the colour; each pairs its tone with
 * the label, and `-t` keeps the text above 4.5:1 on the soft fill.
 */
export const PLAN_TYPE_BADGE_CLASSES: Record<string, string> = {
  family: 'border-(--sm-emerald-b) bg-(--sm-emerald-s) text-(--sm-emerald-t)',
  individual: 'border-(--sm-indigo-b) bg-(--sm-indigo-s) text-(--sm-indigo-t)',
  shared: 'border-(--sm-gold-b) bg-(--sm-gold-s) text-(--sm-gold-t)',
};

type PlanRowProps = {
  /** Edit and delete are admin mutations. */
  canManage: boolean;
  onDeleteAction: () => void;
  onEditAction: () => void;
  /** Opens the summary sheet. View inside the row navigates to the page. */
  onViewAction: () => void;
  row: PlanRowData;
  serviceNames: Map<string, string>;
};
