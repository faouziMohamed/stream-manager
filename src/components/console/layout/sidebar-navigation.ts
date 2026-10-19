import type { ComponentType } from 'react';
import {
  BarChart3,
  Calendar,
  CreditCard,
  Image,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  Monitor,
  Settings,
  ShieldCheck,
  Tv,
  Users,
} from 'lucide-react';

import { ROUTES } from '@/lib/config/routes';

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  badgeTone?: 'danger' | 'warning';
};

export type NavSection = {
  label: string;
  helper: string;
  items: NavItem[];
  icon: ComponentType<{ className?: string }>;
  tone: 'coral' | 'gold' | 'indigo' | 'emerald' | 'violet';
  defaultOpen?: boolean;
};

export const overviewItem: NavItem = {
  label: 'Dashboard',
  href: ROUTES.console.root,
  icon: LayoutDashboard,
};

export function buildSidebarSections(role?: string): NavSection[] {
  const isAdminRole = role === 'admin';
  const insightsItems: NavItem[] = [
    { label: 'Timeline', href: ROUTES.console.timeline, icon: Calendar },
    // Summary links are an admin surface: listing, generating and revoking all
    // require `requireAdmin`.
    ...(isAdminRole ? [{ label: 'Summary', href: ROUTES.console.summary, icon: Link2 }] : []),
  ];

  if (isAdminRole) {
    insightsItems.unshift({ label: 'Analytics', href: ROUTES.console.analytics, icon: BarChart3 });
  }

  const sections: NavSection[] = [
    {
      label: 'Catalog',
      helper: 'Services and plans',
      icon: Monitor,
      tone: 'gold',
      defaultOpen: true,
      items: [
        { label: 'Plans', href: ROUTES.console.plans, icon: LayoutGrid },
        { label: 'Services', href: ROUTES.console.services, icon: Monitor },
        // Service artwork lives with the catalog it decorates, not under
        // Insights, where it was the only item that was not a report. The media
        // library is admin-only, so its entry is too.
        ...(isAdminRole ? [{ label: 'Media', href: ROUTES.console.media, icon: Image }] : []),
      ],
    },
    {
      label: 'Operations',
      helper: 'Billing and active plans',
      icon: CreditCard,
      tone: 'coral',
      defaultOpen: true,
      items: [
        { label: 'Memberships', href: ROUTES.console.memberships, icon: Link2 },
        { label: 'Payments', href: ROUTES.console.payments, icon: CreditCard },
        { label: 'Streaming', href: ROUTES.console.streamingAccounts, icon: Tv },
      ],
    },
    {
      label: 'Customers',
      helper: 'Accounts and ownership',
      icon: Users,
      tone: 'emerald',
      defaultOpen: false,
      items: [{ label: 'Customers', href: ROUTES.console.customers, icon: Users }],
    },
    {
      label: 'Insights',
      helper: 'Reports and timeline',
      icon: Calendar,
      tone: 'violet',
      defaultOpen: false,
      items: insightsItems,
    },
  ];

  if (role === 'admin') {
    return [...sections, adminSection];
  }

  return sections;
}

export function isActiveLink(pathname: string, href: string): boolean {
  if (href === ROUTES.console.root) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isSectionActive(pathname: string, section: NavSection): boolean {
  return section.items.some((item) => isActiveLink(pathname, item.href));
}

const adminSection: NavSection = {
  label: 'Administration',
  helper: 'System controls',
  icon: Settings,
  tone: 'violet',
  defaultOpen: false,
  items: [
    { label: 'Sessions', href: ROUTES.console.settings.sessions, icon: ShieldCheck },
    { label: 'Users', href: ROUTES.console.users, icon: Users },
  ],
};
