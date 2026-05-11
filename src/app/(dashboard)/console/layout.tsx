import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ConsoleSidebar } from '@/components/console/console-sidebar';
import { ConsoleTopbar } from '@/components/console/console-topbar';
import { ConsoleBreadcrumbs } from '@/components/console/console-breadcrumbs';
import { SidebarProvider } from '@/components/console/sidebar-context';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <ConsoleSidebar />
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
