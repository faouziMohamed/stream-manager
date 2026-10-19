'use client';

import { CreditCard, LayoutDashboard, Link2, MenuIcon, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';

import { isActiveLink } from '@/components/console/layout/sidebar-navigation';
import { useSidebar } from '@/components/console/layout/sidebar-context';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

const BOTTOM_NAV_ITEMS: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}[] = [
  { href: ROUTES.console.root, icon: LayoutDashboard, label: 'Home' },
  { href: ROUTES.console.memberships, icon: Link2, label: 'Members' },
  { href: ROUTES.console.payments, icon: CreditCard, label: 'Payments' },
  { href: ROUTES.console.customers, icon: Users, label: 'Customers' },
];

/**
 * The four destinations an operator reaches most, within thumb reach. The
 * drawer stays available behind "More" for everything else, so the phone
 * layout never depends on a hamburger alone.
 */
export function ConsoleBottomNav() {
  const pathname = usePathname();
  const { toggle } = useSidebar();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-(--sm-border) bg-(--sm-bg) pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = isActiveLink(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 border-t-2 text-[11px] font-medium',
              active
                ? 'border-(--sm-coral) text-(--sm-coral)'
                : 'border-transparent text-(--sm-muted)'
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}

      <Button
        aria-label="Open navigation"
        className="h-auto min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-none border-t-2 border-transparent text-[11px] font-medium text-(--sm-muted)"
        onClick={toggle}
        type="button"
        variant="ghost"
      >
        <MenuIcon className="size-5" />
        More
      </Button>
    </nav>
  );
}
