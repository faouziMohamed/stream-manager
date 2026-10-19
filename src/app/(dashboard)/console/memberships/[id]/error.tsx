'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config/routes';

export default function MembershipDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-20 text-center">
      <AlertTriangle className="mb-4 size-10 text-(--sm-coral)" />
      <h1 className="text-xl font-semibold text-(--sm-fg)">Failed to load membership</h1>
      <p className="mt-2 text-sm text-(--sm-muted)">{error.message}</p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
        <Link href={ROUTES.console.memberships}>
          <Button size="sm" className="bg-(--sm-coral) text-(--sm-coral-fg)">
            Back to memberships
          </Button>
        </Link>
      </div>
    </main>
  );
}
