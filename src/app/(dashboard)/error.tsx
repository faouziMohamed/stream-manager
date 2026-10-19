'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { ErrorScreen } from '@/components/shared/error-screen';
import { ForbiddenScreen } from '@/components/shared/forbidden-screen';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config/routes';
import { clientLogger } from '@/lib/logger/client-logger';

const log = clientLogger('dashboard-error');

/**
 * The console's error boundary. It renders the same screen as the rest of the
 * failure surfaces, keeps the operator on the URL they were reading, and
 * carries the digest so a report can be matched to the server log.
 */
export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    log.error('Console error', error);
  }, [error]);

  const isForbidden = /forbidden|permission/i.test(error.message ?? '');

  if (isForbidden) {
    return <ForbiddenScreen />;
  }

  return (
    <ErrorScreen
      code="500"
      title="This page could not be loaded"
      description="A request behind this page failed. Trying again is usually enough; if it keeps failing, the surviving pages still work and no data has been changed by the error."
      meta={error.digest === undefined ? undefined : `Digest ${error.digest}`}
      actions={
        <>
          <Button onClick={() => reset()} variant="accent">
            Try again
          </Button>
          <Link
            className="text-sm text-(--sm-fg) underline-offset-4 hover:underline"
            href={ROUTES.console.root}
          >
            Back to dashboard
          </Link>
        </>
      }
      links={[
        { href: ROUTES.console.customers, label: 'Customers' },
        { href: ROUTES.console.memberships, label: 'Memberships' },
        { href: ROUTES.console.payments, label: 'Payments' },
      ]}
    />
  );
}

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};
