import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ConsoleSidebar } from '@/components/console/console-sidebar';
import { ConsoleTopbar } from '@/components/console/console-topbar';
import { ConsoleBreadcrumbs } from '@/components/console/console-breadcrumbs';
import { SidebarProvider } from '@/components/console/sidebar-context';
import { getAllPayments } from '@/modules/payments/server/repositories/payments.repository';
import { getAllSubscriptions } from '@/modules/subscriptions/server/repositories/subscriptions.repository';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const { overdueCount, expiringSoonCount } = await getSidebarCounts();

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <ConsoleSidebar overdueCount={overdueCount} expiringSoonCount={expiringSoonCount} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ConsoleTopbar />
          <main className="bg-muted/20 content-scrollbar flex-1 overflow-y-auto p-4 md:p-6">
            <ConsoleBreadcrumbs />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

async function getSidebarCounts() {
  try {
    const [overduePayments, activeSubscriptions] = await Promise.all([
      getAllPayments({ status: 'overdue' }),
      getAllSubscriptions(undefined, 'active'),
    ]);

    const today = Date.now();
    const in30Days = today + 30 * 24 * 60 * 60 * 1000;
    const expiringSoonCount = activeSubscriptions.filter((s) => {
      if (!s.endDate) return false;
      const end = new Date(s.endDate).getTime();
      return end >= today && end <= in30Days;
    }).length;

    return { overdueCount: overduePayments.length, expiringSoonCount };
  } catch {
    return { overdueCount: 0, expiringSoonCount: 0 };
  }
}
