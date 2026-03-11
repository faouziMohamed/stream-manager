import { ConsoleSidebar } from '@/components/console/console-sidebar';
import { ConsoleTopbar } from '@/components/console/console-topbar';

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <ConsoleSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <ConsoleTopbar />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  );
}
