import { headers } from 'next/headers';
import Link from 'next/link';

import { ErrorScreen } from '@/components/shared/error-screen';
import { buttonVariants } from '@/components/ui/button';
import { ROUTES } from '@/lib/config/routes';

export const metadata = { title: 'Page not found' };

export default async function NotFound() {
  // Naming the address that missed turns "wrong link" into something the
  // reader can act on — a typo, a stale bookmark, a deleted record.
  const requestHeaders = await headers();
  const attemptedPath = requestHeaders.get('x-current-path') ?? undefined;

  return (
    <ErrorScreen
      code="404"
      title="This page does not exist"
      description="The address is wrong, or the record behind it has been deleted. Nothing on any account has changed."
      meta={attemptedPath}
      actions={
        <Link className={buttonVariants({ variant: 'accent' })} href={ROUTES.console.root}>
          Back to dashboard
        </Link>
      }
      links={[
        { href: ROUTES.console.customers, label: 'Customers' },
        { href: ROUTES.console.memberships, label: 'Memberships' },
        { href: ROUTES.console.payments, label: 'Payments' },
        { href: ROUTES.home, label: 'Public site' },
      ]}
    />
  );
}
