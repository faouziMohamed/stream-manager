'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Monitor,
  CreditCard,
  Calendar,
  BarChart3,
  Settings,
  Tag,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { Separator } from '@/components/ui/separator';

const navItems = [
  {
    label: 'Tableau de bord',
    href: '/console',
    icon: LayoutDashboard,
    exact: true,
  },
  { type: 'separator', label: 'Gestion' },
  { label: 'Services', href: '/console/services', icon: Monitor },
  { label: 'Promotions', href: '/console/promotions', icon: Star },
  { label: 'Clients', href: '/console/clients', icon: Users },
  { label: 'Abonnements', href: '/console/subscriptions', icon: Tag },
  { label: 'Paiements', href: '/console/payments', icon: CreditCard },
  { type: 'separator', label: 'Visualisation' },
  { label: 'Chronologie', href: '/console/timeline', icon: Calendar },
  { label: 'Analytiques', href: '/console/analytics', icon: BarChart3 },
  { type: 'separator', label: 'Compte' },
  { label: 'Résumé partagé', href: '/console/summary', icon: BarChart3 },
  { label: 'Paramètres', href: '/console/settings', icon: Settings },
] as const;

type NavItem =
  | { type: 'separator'; label: string }
  | {
      label: string;
      href: string;
      icon: React.ElementType;
      exact?: boolean;
      type?: never;
    };

export function ConsoleSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))]">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/console" className="flex items-center gap-2">
          <Monitor className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">StreamManager</span>
        </Link>
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
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5',
                active
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {navItem.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <Link
          href="/"
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          ← Voir le site public
        </Link>
      </div>
    </aside>
  );
}
