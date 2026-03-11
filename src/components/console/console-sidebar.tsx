'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';
import {
    BarChart3,
    Calendar,
    ChevronDown,
    Cloud,
    CreditCard,
    Globe,
    Images,
    LayoutDashboard,
    Link2,
    Mail,
    Monitor,
    Settings,
    Settings2,
    Star,
    Tag,
    Tv2,
    Users,
    X,
} from 'lucide-react';
import {cn} from '@/lib/utils/helpers';
import {useSidebar} from '@/components/console/sidebar-context';
import {ROUTES} from '@/lib/config/routes';

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavSeparator = { type: 'separator'; label: string };
type NavLink = { label: string; href: string; icon: React.ElementType; exact?: boolean };
type NavGroup = { type: 'group'; label: string; icon: React.ElementType; children: NavLink[]; defaultOpen?: boolean };
type NavItem = NavSeparator | NavLink | NavGroup;

const navItems: NavItem[] = [
    {label: 'Tableau de bord', href: ROUTES.console.root, icon: LayoutDashboard, exact: true},
    {type: 'separator', label: 'Gestion'},
    {label: 'Paiements', href: ROUTES.console.payments, icon: CreditCard},
    {
        type: 'group',
        label: 'Catalogue',
        icon: Monitor,
        defaultOpen: true,
        children: [
            {label: 'Services', href: ROUTES.console.services, icon: Monitor},
            {label: 'Promotions', href: ROUTES.console.promotions, icon: Star},
            {label: 'Abonnements', href: ROUTES.console.subscriptions, icon: Tag},
        ],
    },
    {label: 'Comptes streaming', href: ROUTES.console.accounts, icon: Tv2},
    {label: 'Clients', href: ROUTES.console.clients, icon: Users},
    {type: 'separator', label: 'Visualisation'},
    {label: 'Chronologie', href: ROUTES.console.timeline, icon: Calendar},
    {label: 'Analytiques', href: ROUTES.console.analytics, icon: BarChart3},
    {type: 'separator', label: 'Compte'},
    {label: 'Résumé partagé', href: ROUTES.console.summary, icon: Link2},
    {type: 'separator', label: 'Outils'},
    {label: 'Médiathèque', href: ROUTES.console.media, icon: Images},
    {
        type: 'group',
        label: 'Paramètres',
        icon: Settings,
        children: [
            {label: 'Général', href: ROUTES.console.settings.root, icon: Settings2},
            {label: 'SMTP', href: ROUTES.console.settings.smtp, icon: Mail},
            {label: 'Cloudinary', href: ROUTES.console.settings.cloudinary, icon: Cloud},
        ],
    },
];

// ─── Collapsible group ────────────────────────────────────────────────────────

function NavGroupItem({item, onNav}: { item: NavGroup; onNav?: () => void }) {
    const pathname = usePathname();
    const isChildActive = item.children.some((c) => pathname.startsWith(c.href));
    const [open, setOpen] = useState(isChildActive || item.defaultOpen === true);
    const Icon = item.icon;

    return (
        <div>
            <button
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5 cursor-pointer',
                    isChildActive
                        ? 'bg-white/15 text-white font-medium'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
            >
                <Icon className="h-4 w-4 shrink-0"/>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}/>
            </button>
            {open && (
                <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mb-1">
                    {item.children.map((child) => {
                        const CIcon = child.icon;
                        const active = pathname.startsWith(child.href);
                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                onClick={onNav}
                                className={cn(
                                    'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                                    active
                                        ? 'bg-white/15 text-white font-medium'
                                        : 'text-white/60 hover:bg-white/10 hover:text-white',
                                )}
                            >
                                <CIcon className="h-3.5 w-3.5 shrink-0"/>
                                {child.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({onNav}: { onNav?: () => void }) {
    const pathname = usePathname();
    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    return (
        <div className="flex flex-col h-full bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))]">
            {/* Logo */}
            <div className="px-4 py-4 border-b border-white/10">
                <Link href={ROUTES.console.root} onClick={onNav} className="flex items-center gap-2 mb-2">
                    <Monitor className="h-6 w-6 text-white shrink-0"/>
                    <span className="font-bold text-lg">StreamManager</span>
                </Link>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-0.5">
                    Espace administration
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {navItems.map((item, i) => {
                    if ('type' in item && item.type === 'separator') {
                        return (
                            <div key={`sep-${i}`} className="mt-4 mb-1 px-3">
                                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                                    {item.label}
                                </p>
                            </div>
                        );
                    }
                    if ('type' in item && item.type === 'group') {
                        return <NavGroupItem key={`group-${i}`} item={item} onNav={onNav}/>;
                    }
                    const link = item as NavLink;
                    const Icon = link.icon;
                    const active = isActive(link.href, link.exact);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onNav}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5',
                                active
                                    ? 'bg-white/15 text-white font-medium'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0"/>
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-3 py-3 border-t border-white/10">
                <Link
                    href={ROUTES.home}
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

// ─── Export ───────────────────────────────────────────────────────────────────

export function ConsoleSidebar() {
    const {open, close} = useSidebar();

    return (
        <>
            <aside className="hidden md:flex w-64 shrink-0 flex-col h-full">
                <SidebarContent/>
            </aside>

            {open && (
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={close} aria-hidden="true"/>
            )}

            <aside className={cn(
                'fixed inset-y-0 left-0 z-50 w-72 flex flex-col md:hidden transition-transform duration-300',
                open ? 'translate-x-0' : '-translate-x-full',
            )}>
                <div className="absolute top-3 right-3">
                    <button
                        onClick={close}
                        className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
