'use client';

import { Archive, ExternalLink, Pencil } from 'lucide-react';
import Link from 'next/link';

import {
  ConsoleMobileActions,
  ConsoleMobileCard,
  ConsoleMobileCardHeader,
} from '@/components/console/shared/console-mobile-list';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import type { CustomerListItem } from '@/features/customers/shared/customer.types';

export function CustomerCard({
  canManage,
  customer,
  onEdit,
  onArchive,
  onOpenAction,
}: CustomerCardProps) {
  const hasContact =
    (customer.email !== null && customer.email !== undefined) ||
    (customer.phone !== null && customer.phone !== undefined);

  return (
    <ConsoleMobileCard onClick={onOpenAction}>
      <ConsoleMobileCardHeader>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-(--sm-fg)">{customer.name}</p>
          <p className="mt-0.5 text-xs text-(--sm-muted)">{customer.businessId}</p>
        </div>
        <CustomerStatusBadge isActive={customer.isActive} />
      </ConsoleMobileCardHeader>

      <div className="mt-3 flex flex-col gap-0.5">
        {customer.email !== null && customer.email !== undefined && (
          <p className="truncate text-sm text-(--sm-fg)">{customer.email}</p>
        )}
        {customer.phone !== null && customer.phone !== undefined && (
          <p className="text-xs text-(--sm-muted)">{customer.phone}</p>
        )}
        {!hasContact && <p className="text-xs text-(--sm-muted)">No contact details</p>}
      </div>

      <ConsoleMobileActions>
        <Link
          className={cn(buttonVariants({ size: 'sm', variant: 'info' }), 'gap-1')}
          href={ROUTES.console.customerDetail(customer.id)}
          onClick={(event) => event.stopPropagation()}
        >
          <ExternalLink className="size-3.5" />
          View
        </Link>
        {canManage ? (
          <>
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
            {customer.isActive ? (
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  onArchive();
                }}
                size="sm"
                variant="destructive"
              >
                <Archive className="size-3.5" />
                Archive
              </Button>
            ) : null}
          </>
        ) : null}
      </ConsoleMobileActions>
    </ConsoleMobileCard>
  );
}

export function CustomerStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <StatusBadge tone={isActive ? 'positive' : 'neutral'}>
      {isActive ? 'Active' : 'Archived'}
    </StatusBadge>
  );
}

type CustomerCardProps = {
  /** Edit and archive are admin mutations. */
  canManage: boolean;
  customer: CustomerListItem;
  onArchive: () => void;
  onEdit: () => void;
  onOpenAction: () => void;
};
