'use client';

import { ArrowRight, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/console/shared/status-badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { CustomerListItem } from '@/features/customers/shared/customer.types';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';

/**
 * What a row click shows: who this customer is and how to reach them. Billing
 * history and membership detail belong on the page, which the footer opens.
 */
export function CustomerSummarySheet({
  customer,
  onOpenChangeAction,
  open,
}: CustomerSummarySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChangeAction}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {customer === null ? null : (
          <>
            <SheetHeader>
              <SheetTitle className="truncate">{customer.name}</SheetTitle>
              <SheetDescription>{customer.businessId}</SheetDescription>
              <div className="mt-3">
                <StatusBadge tone={customer.isActive ? 'positive' : 'neutral'}>
                  {customer.isActive ? 'Active' : 'Archived'}
                </StatusBadge>
              </div>
            </SheetHeader>

            <div className="space-y-4 px-4 py-3">
              <Row label="Email">
                {customer.email === null || customer.email === undefined ? (
                  <span className="text-(--sm-muted)">Not set</span>
                ) : (
                  <Link
                    className="inline-flex items-center gap-1.5 text-(--sm-coral) hover:underline"
                    href={`mailto:${customer.email}`}
                  >
                    <Mail className="size-3.5" />
                    {customer.email}
                  </Link>
                )}
              </Row>
              <Row label="Phone">
                {customer.phone === null || customer.phone === undefined ? (
                  <span className="text-(--sm-muted)">Not set</span>
                ) : (
                  <Link
                    className="inline-flex items-center gap-1.5 text-(--sm-coral) hover:underline"
                    href={`tel:${customer.phone}`}
                  >
                    <Phone className="size-3.5" />
                    {customer.phone}
                  </Link>
                )}
              </Row>
              <Row label="Joined">{formatDisplayDate(customer.createdAt.slice(0, 10))}</Row>
            </div>

            <SheetFooter>
              <Link
                className={cn(buttonVariants({ variant: 'accent' }), 'w-full gap-2')}
                href={ROUTES.console.customerDetail(customer.id)}
              >
                Open customer page
                <ArrowRight className="size-4" />
              </Link>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-(--sm-border) pb-3 text-sm last:border-0">
      <span className="shrink-0 text-(--sm-muted)">{label}</span>
      <span className="min-w-0 text-right font-medium text-(--sm-fg)">{children}</span>
    </div>
  );
}

type CustomerSummarySheetProps = {
  customer: CustomerListItem | null;
  onOpenChangeAction: (open: boolean) => void;
  open: boolean;
};
