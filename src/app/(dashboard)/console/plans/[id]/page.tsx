import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';
import { loadPlanDetail } from '@/features/plans/server/loaders/plans.loader';
import { PlanDetail } from '@/features/plans/ui/components/plan-detail';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { id } = await params;
  const payload = await loadPlanDetail(id);

  if (payload === null) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <Link
          href={ROUTES.console.plans}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-2 text-(--sm-muted) hover:text-(--sm-fg)'
          )}
        >
          <ArrowLeft className="size-4" />
          Plans
        </Link>
      </div>

      <header className="mb-8 flex flex-col gap-5 border-b border-(--sm-border) pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="sm-title text-3xl font-semibold tracking-tight">{payload.plan.name}</h1>
        </div>
      </header>

      <PlanDetail payload={payload} />
    </main>
  );
}

type PlanDetailPageProps = {
  params: Promise<{ id: string }>;
};
