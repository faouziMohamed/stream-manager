'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {
    BarChart3,
    Calendar,
    CreditCard,
    Globe,
    LayoutDashboard,
    Monitor,
    Settings,
    Star,
    Tag,
    Tv2,
    Users,
    X,
} from 'lucide-react';
import {cn} from '@/lib/utils/helpers';
import {useSidebar} from '@/components/console/sidebar-context';

const navItems = [
    {label: 'Tableau de bord', href: '/console', icon: LayoutDashboard, exact: true},
    {type: 'separator', label: 'Gestion'},
    {label: 'Services', href: '/console/services', icon: Monitor},
    {label: 'Promotions', href: '/console/promotions', icon: Star},
    {label: 'Comptes streaming', href: '/console/accounts', icon: Tv2},
    {label: 'Clients', href: '/console/clients', icon: Users},
    {label: 'Abonnements', href: '/console/subscriptions', icon: Tag},
    {label: 'Paiements', href: '/console/payments', icon: CreditCard},
    {type: 'separator', label: 'Visualisation'},
    {label: 'Chronologie', href: '/console/timeline', icon: Calendar},
    {label: 'Analytiques', href: '/console/analytics', icon: BarChart3},
    {type: 'separator', label: 'Compte'},
    {label: 'Résumé partagé', href: '/console/summary', icon: BarChart3},
    {label: 'Paramètres', href: '/console/settings', icon: Settings},
] as const;

type NavItem =
    | { type: 'separator'; label: string }
    | { label: string; href: string; icon: React.ElementType; exact?: boolean; type?: never };

function SidebarContent({onNav}: { onNav?: () => void }) {
    const pathname = usePathname();
    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    return (
        <div className="flex flex-col h-full bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))]">
            {/* Logo + badge */}
            <div className="px-4 py-4 border-b border-white/10">
                <Link href="/console" onClick={onNav} className="flex items-center gap-2 mb-2">
                    <Monitor className="h-6 w-6 text-primary shrink-0"/>
                    <span className="font-bold text-lg">StreamManager</span>
                </Link>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-0.5">
                    Espace administration
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {Array.from(navItems).map((item, i) => {
                    const navItem = item as NavItem;
                    if (navItem.type === 'separator') {
                        return (
                            <div key={`sep-${i}`} className="mt-4 mb-1 px-3">
                                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                                    {navItem.label}
                                </p>
                            </div>
                        );
                    }
                    const Icon = navItem.icon;
                    const active = isActive(navItem.href, navItem.exact);
                    return (
                        <Link
                            key={navItem.href}
                            href={navItem.href}
                            onClick={onNav}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5',
                                active
                                    ? 'bg-white/15 text-white font-medium'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0"/>
                            {navItem.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer — link to public site */}
            <div className="px-3 py-3 border-t border-white/10">
                <Link
                    href="/"
                    onClick={onNav}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <Globe className="h-4 w-4 shrink-0"/>
                    Voir le site public
                </Link>
            </div>
        </div>
    );
}

export function ConsoleSidebar() {
    const {open, close} = useSidebar();

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden md:flex w-64 shrink-0 flex-col h-full">
                <SidebarContent/>
            </aside>

            {/* Mobile overlay */}
            {open && (
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={close} aria-hidden="true"/>
            )}

            {/* Mobile drawer */}
            <aside className={cn(
                'fixed inset-y-0 left-0 z-50 w-72 flex flex-col md:hidden transition-transform duration-300',
                open ? 'translate-x-0' : '-translate-x-full',
            )}>
                <div className="absolute top-3 right-3">
                    <button
                        onClick={close}
                        className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Fermer le menu"
                    >
                        <X className="h-5 w-5"/>
                    </button>
                </div>
                <SidebarContent onNav={close}/>
            </aside>
        </>
    );
}
