import Link from 'next/link';

import { ErrorScreen } from '@/components/shared/error-screen';
import { SessionRecheckButton } from '@/components/shared/session-recheck-button';
import { buttonVariants } from '@/components/ui/button';
import { ROUTES } from '@/lib/config/routes';

/**
 * Where a signed-in account lands when its role cannot open the console.
 *
 * Shared by the `/forbidden` route and the console layout so both say the
 * same thing; the layout renders it in place, which is what keeps the
 * operator's URL intact when a rewrite sends them here.
 *
 * It names who is signed in and what that role cannot do, so the reader can
 * tell "ask an admin to change my role" from "I am signed in as the wrong
 * person" without opening a ticket.
 */
export function ForbiddenScreen({ email, role }: ForbiddenScreenProps) {
  const signedIn = email !== undefined && email !== null;
  const who = signedIn
    ? `${email}${role === undefined || role === null ? '' : ` (${role})`}`
    : 'This account';

  return (
    <ErrorScreen
      code="403"
      title="You do not have access to this area"
      description={
        signedIn
          ? `${who} cannot open the console. Ask an administrator to change the role, or sign in with another account.`
          : 'This part of the console is limited to operators. Sign in with an account that has access.'
      }
      actions={
        <>
          {signedIn ? <SessionRecheckButton /> : null}
          <Link
            className={buttonVariants({ variant: signedIn ? 'outline' : 'accent' })}
            href={ROUTES.auth.login}
          >
            {signedIn ? 'Sign in with another account' : 'Sign in'}
          </Link>
        </>
      }
      links={[{ href: ROUTES.home, label: 'Public site' }]}
    />
  );
}

type ForbiddenScreenProps = {
  email?: string | null;
  role?: string | null;
};
