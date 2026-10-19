'use client';

import { Archive, ExternalLink, Pencil } from 'lucide-react';
import Link from 'next/link';

import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { CustomerStatusBadge } from '@/features/customers/ui/components/customer-card';
import type { CustomerListItem } from '@/features/customers/shared/customer.types';
import { ROUTES } from '@/lib/config/routes';

export function CustomerRow({
  canManage,
  customer,
  onEdit,
  onArchive,
  onOpenAction,
}: CustomerRowProps) {
  return (
    <TableRow
      className="cursor-pointer border-b border-(--sm-border) hover:bg-(--sm-hover)"
      onClick={onOpenAction}
    >
      <TableCell className="px-4 py-4 sm:px-6">
        <div>
          <Button
            className="h-auto justify-start p-0 text-sm font-semibold text-(--sm-fg) hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              onOpenAction();
            }}
            type="button"
            variant="link"
          >
            {customer.name}
          </Button>
          <p className="mt-0.5 text-xs text-(--sm-muted)">{customer.businessId}</p>
        </div>
      </TableCell>
      <TableCell className="hidden px-4 py-4 sm:table-cell sm:px-6">
        <div className="flex flex-col gap-0.5">
          {customer.email !== null && customer.email !== undefined && (
            <p className="text-sm text-(--sm-fg)">{customer.email}</p>
          )}
          {customer.phone !== null && customer.phone !== undefined && (
            <p className="text-xs text-(--sm-muted)">{customer.phone}</p>
          )}
          {customer.email === null && customer.phone === null && (
            <p className="text-xs text-(--sm-muted)">—</p>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-4 sm:px-6">
        <CustomerStatusBadge isActive={customer.isActive} />
      </TableCell>
      {/* Three actions, three buttons: a menu hid every one of them behind a
          click, and the row is wide enough to carry them. */}
      <TableCell className="px-4 py-4 sm:px-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <WithTooltip label="View customer detail">
            <Link
              aria-label="View customer detail"
              className="inline-flex size-8 items-center justify-center rounded-md border border-(--sm-indigo-b) bg-(--sm-indigo-s) text-(--sm-indigo-t) hover:border-(--sm-indigo)/60"
              href={ROUTES.console.customerDetail(customer.id)}
            >
              <ExternalLink className="size-3.5" />
            </Link>
          </WithTooltip>
          {canManage ? (
            <>
              <WithTooltip label="Edit customer">
                <Button
                  aria-label="Edit customer"
                  className="size-8 border-(--sm-gold-b) bg-(--sm-gold-s) text-(--sm-gold-t) hover:border-(--sm-gold)/60 hover:bg-(--sm-gold-s) hover:text-(--sm-gold-t)"
                  onClick={onEdit}
                  size="icon"
                  variant="outline"
                >
                  <Pencil className="size-3.5" />
                </Button>
              </WithTooltip>
              {customer.isActive ? (
                <WithTooltip label="Archive customer">
                  <Button
                    aria-label="Archive customer"
                    className="size-8 border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral-t) hover:border-(--sm-coral)/60 hover:bg-(--sm-coral-s) hover:text-(--sm-coral-t)"
                    onClick={onArchive}
                    size="icon"
                    variant="outline"
                  >
                    <Archive className="size-3.5" />
                  </Button>
                </WithTooltip>
              ) : null}
            </>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

type CustomerRowProps = {
  /** Edit and archive are admin mutations. */
  canManage: boolean;
  /** Opens the summary sheet; the View button navigates to the page instead. */
  onOpenAction: () => void;
  customer: CustomerListItem;
  onEdit: () => void;
  onArchive: () => void;
};
