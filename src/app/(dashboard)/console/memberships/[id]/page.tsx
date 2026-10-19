import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { loadMembershipDetail } from '@/features/memberships/server/loaders/membership-detail.loader';
import { MembershipDetail } from '@/features/memberships/ui/components/membership-detail';
import { isCurrentUserAdmin } from '@/lib/auth/current-user';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

export default async function MembershipDetailPage({ params }: MembershipDetailPageProps) {
  const { id } = await params;
  const [payload, canManage] = await Promise.all([loadMembershipDetail(id), isCurrentUserAdmin()]);

  if (payload.membership === null) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <Link
          href={ROUTES.console.memberships}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-2 text-(--sm-muted) hover:text-(--sm-fg)'
          )}
        >
          <ArrowLeft className="size-4" />
          Memberships
        </Link>
      </div>

      <header className="mb-8 flex flex-col gap-5 border-b border-(--sm-border) pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="sm-title text-3xl font-semibold tracking-tight">
            {payload.membership.businessId}
          </h1>
          <p className="sm-subtitle mt-2 text-sm">
            {payload.customer?.name ?? 'Unknown customer'} · {payload.plan?.name ?? 'Unknown plan'}
          </p>
        </div>
      </header>

      <MembershipDetail canManage={canManage} payload={payload} />
    </main>
  );
}

type MembershipDetailPageProps = {
  params: Promise<{ id: string }>;
};
