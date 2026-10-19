import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { buttonVariants } from '@/components/ui/button';
import { loadServiceDetail } from '@/features/services/server/loaders/services.loader';
import { ServiceDetail } from '@/features/services/ui/components/service-detail';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { id } = await params;
  const payload = await loadServiceDetail(id);

  if (payload === null) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <Link
          href={ROUTES.console.services}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-2 text-(--sm-muted) hover:text-(--sm-fg)'
          )}
        >
          <ArrowLeft className="size-4" />
          Services
        </Link>
      </div>

      <header className="mb-8 flex flex-col gap-5 border-b border-(--sm-border) pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="sm-title text-3xl font-semibold tracking-tight">{payload.service.name}</h1>
        </div>
      </header>

      <ServiceDetail payload={payload} />
    </main>
  );
}

type ServiceDetailPageProps = {
  params: Promise<{ id: string }>;
};
