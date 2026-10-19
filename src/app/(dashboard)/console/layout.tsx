import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ForbiddenScreen } from '@/components/shared/forbidden-screen';
import { ConsoleBottomNav } from '@/components/console/layout/bottom-nav';
import { SessionRoleSync } from '@/components/console/layout/session-role-sync';
import { Sidebar } from '@/components/console/layout/sidebar';
import { SidebarProvider } from '@/components/console/layout/sidebar-context';
import { Topbar } from '@/components/console/layout/topbar';
import { auth } from '@/lib/auth/auth';
import { buildLoginRedirectPath } from '@/lib/auth/auth-routing.helpers';
import { hasSignedInSession } from '@/lib/auth/auth-session.helpers';
import { getCurrentConsoleUser } from '@/lib/auth/current-user';
import { canAccessConsole } from '@/lib/auth/role.helpers';
import { ROUTES } from '@/lib/config/routes';

// Every console route reads the session, so none of them can be statically
// rendered. Declaring it here stops Next probing static rendering of all 20
// pages at build time, which made each loader log its auth failure at error
// level — noise that would hide a real build failure.
export const dynamic = 'force-dynamic';

// Private operations data: never indexed, never followed.
export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

export default async function ConsoleLayout({ children }: ConsoleLayoutProps) {
  const session = await auth();
  const requestHeaders = await headers();
  const interruptedPath = requestHeaders.get('x-current-path') ?? ROUTES.console.root;

  if (!hasSignedInSession(session)) {
    redirect(buildLoginRedirectPath(interruptedPath));
  }

  // The cookie can outlive the session row — a revoked session, a restored or
  // switched database. The database is also the only authority on the role:
  // the JWT can say `user` long after the operator was promoted. Reading the
  // user row here keeps both the guard and the chrome honest without a
  // sign-out.
  const user = await getCurrentConsoleUser();

  if (user === null) {
    redirect(buildLoginRedirectPath(interruptedPath));
  }

  if (!canAccessConsole(user.role)) {
    // Rendered in place: a redirect would move the operator to /forbidden and
    // lose the page they were trying to open. The proxy rewrites the same
    // screen for requests it can refuse earlier.
    return <ForbiddenScreen email={user.email} role={user.role} />;
  }

  return (
    <section className="sm-page-bg h-screen overflow-hidden">
      <SidebarProvider>
        <div className="flex h-full">
          <Sidebar userRole={user.role} />
          <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
            <Topbar userName={user.name} userRole={user.role} />
            <main className="sm-console-content flex-1 overflow-y-auto pb-20 md:pb-0">
              {children}
            </main>
          </div>
        </div>
        <ConsoleBottomNav />
        <SessionRoleSync />
      </SidebarProvider>
    </section>
  );
}

type ConsoleLayoutProps = {
  children: ReactNode;
};
