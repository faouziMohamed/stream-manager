import {ConsoleSidebar} from '@/components/console/console-sidebar';
import {ConsoleTopbar} from '@/components/console/console-topbar';
import {SidebarProvider} from '@/components/console/sidebar-context';

export default function ConsoleLayout({children}: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex h-screen overflow-hidden">
                <ConsoleSidebar/>
                <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                    <ConsoleTopbar/>
                    <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
