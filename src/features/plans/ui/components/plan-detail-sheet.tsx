'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { RichTextContent } from '@/components/shared/rich-text/rich-text-content';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/helpers';

const PLAN_TYPE_LABELS: Record<string, string> = {
  family: 'Family',
  individual: 'Individual',
  shared: 'Shared',
};

export interface PlanSummary {
  currencyCode: string;
  descriptionContent?: unknown;
  durationMonths: number;
  id: string;
  isActive: boolean;
  name: string;
  planType: string;
  price: string;
}

export function PlanDetailSheet({
  plan,
  open,
  onOpenChangeAction,
}: {
  plan: PlanSummary | null;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChangeAction}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {plan === null ? null : (
          <>
            <SheetHeader>
              <SheetTitle className="truncate">{plan.name}</SheetTitle>
              <SheetDescription>
                {formatCurrency(Number(plan.price), plan.currencyCode)} · {plan.durationMonths}{' '}
                {plan.durationMonths === 1 ? 'month' : 'months'}
              </SheetDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {PLAN_TYPE_LABELS[plan.planType] ?? plan.planType}
                </Badge>
                <Badge variant={plan.isActive ? 'default' : 'outline'}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </SheetHeader>

            <div className="flex-1 px-4 py-2">
              <p className="text-xs font-semibold tracking-wider text-(--sm-muted) uppercase">
                Description
              </p>
              <RichTextContent
                value={plan.descriptionContent}
                preset="compact"
                className="mt-2"
                fallback={
                  <p className="mt-2 text-sm text-(--sm-muted)">No description added yet.</p>
                }
              />
            </div>

            <SheetFooter>
              <Link
                href={ROUTES.console.planDetail(plan.id)}
                className={cn(buttonVariants({ variant: 'accent' }), 'w-full gap-2')}
              >
                Open full details
                <ArrowRight className="size-4" />
              </Link>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
