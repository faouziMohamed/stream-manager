'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';
import { useState } from 'react';
import {
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  Cloud,
  CreditCard,
  Globe,
  Images,
  Inbox,
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
import { cn } from '@/lib/utils/helpers';
import { useSidebar } from '@/components/console/sidebar-context';
import { ROUTES } from '@/lib/config/routes';

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavSeparator = { type: 'separator'; label: string };
type NavLink = {
  label: string;
  href: string;
  icon: ElementType;
  exact?: boolean;
};
type NavGroup = {
  type: 'group';
  label: string;
  icon: ElementType;
  children: NavLink[];
  defaultOpen?: boolean;
};
type NavItem = NavSeparator | NavLink | NavGroup;

const navItems: NavItem[] = [
  {
    label: 'Tableau de bord',
    href: ROUTES.console.root,
    icon: LayoutDashboard,
    exact: true,
  },
  { type: 'separator', label: 'Gestion' },
  { label: 'Paiements', href: ROUTES.console.payments, icon: CreditCard },
  {
    type: 'group',
    label: 'Catalogue',
    icon: Monitor,
    defaultOpen: true,
    children: [
      { label: 'Services', href: ROUTES.console.services, icon: Monitor },
      { label: 'Promotions', href: ROUTES.console.promotions, icon: Star },
      { label: 'Abonnements', href: ROUTES.console.subscriptions, icon: Tag },
    ],
  },
  { label: 'Comptes streaming', href: ROUTES.console.accounts, icon: Tv2 },
  { label: 'Clients', href: ROUTES.console.clients, icon: Users },
  { label: 'Messages', href: ROUTES.console.inquiries, icon: Inbox },
  { type: 'separator', label: 'Visualisation' },
  { label: 'Chronologie', href: ROUTES.console.timeline, icon: Calendar },
  { label: 'Statistiques', href: ROUTES.console.analytics, icon: BarChart3 },
  { type: 'separator', label: 'Compte' },
  { label: 'Résumé partagé', href: ROUTES.console.summary, icon: Link2 },
  { type: 'separator', label: 'Outils' },
  { label: 'Médiathèque', href: ROUTES.console.media, icon: Images },
  {
    type: 'group',
    label: 'Paramètres',
    icon: Settings,
    children: [
      { label: 'Général', href: ROUTES.console.settings.root, icon: Settings2 },
      { label: 'SMTP', href: ROUTES.console.settings.smtp, icon: Mail },
      {
        label: 'Cloudinary',
        href: ROUTES.console.settings.cloudinary,
        icon: Cloud,
      },
      {
        label: 'Notifications',
        href: ROUTES.console.settings.notifications,
        icon: Bell,
      },
    ],
  },
];

// ─── Collapsible group ────────────────────────────────────────────────────────

function NavGroupItem({ item, onNav }: { item: NavGroup; onNav?: () => void }) {
  const pathname = usePathname();
  const isChildActive = item.children.some((c) => pathname === c.href);
  const [open, setOpen] = useState(isChildActive || item.defaultOpen === true);
  const Icon = item.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'mb-0.5 flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          isChildActive
            ? 'bg-white/15 font-medium text-white'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mb-1 ml-4 space-y-0.5 border-l border-white/10 pl-3">
          {item.children.map((child) => {
            const CIcon = child.icon;
            const active = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNav}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-white/15 font-medium text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}
              >
                <CIcon className="h-3.5 w-3.5 shrink-0" />
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

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))]">
      {/* Logo */}
      <div className="border-b border-white/10 px-4 py-4">
        <Link href={ROUTES.console.root} onClick={onNav} className="mb-2 flex items-center gap-2">
          <Monitor className="h-6 w-6 shrink-0 text-white" />
          <span className="text-lg font-bold">StreamManager</span>
        </Link>
        <span className="px-0.5 text-[10px] font-semibold tracking-widest text-white/30 uppercase">
          Espace administration
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navItems.map((item, i) => {
          if ('type' in item && item.type === 'separator') {
            return (
              <div key={`sep-${i}`} className="mt-4 mb-1 px-3">
                <p className="text-xs font-semibold tracking-wider text-white/40 uppercase">
                  {item.label}
                </p>
              </div>
            );
          }
          if ('type' in item && item.type === 'group') {
            return <NavGroupItem key={`group-${i}`} item={item} onNav={onNav} />;
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
                'relative mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-white/15 font-medium text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-3 py-3">
        <Link
          href={ROUTES.home}
          onClick={onNav}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Globe className="h-4 w-4 shrink-0" />
          Voir le site public
        </Link>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function ConsoleSidebar() {
  const { open, close } = useSidebar();

  return (
    <>
      <aside className="hidden h-full w-64 shrink-0 flex-col md:flex">
        <SidebarContent />
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={close}
            className="cursor-pointer rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent onNav={close} />
      </aside>
    </>
  );
}
