import { ForbiddenScreen } from '@/components/shared/forbidden-screen';
import { auth } from '@/lib/auth/auth';

export const metadata = {
  robots: { follow: false, index: false },
  title: 'Access denied',
};

/**
 * Reachable directly and as the rewrite target of the console guard. The
 * guard rewrites rather than redirects, so in normal use the address bar
 * still shows the page that was denied.
 */
export default async function ForbiddenPage() {
  const session = await auth();

  return <ForbiddenScreen email={session?.user?.email} role={session?.user?.role} />;
}
