'use client';

import { usePathname } from 'next/navigation';

import {
  buildSidebarSections,
  isActiveLink,
  overviewItem,
} from '@/components/console/layout/sidebar-navigation';
import type { AuthRole } from '@/lib/auth/auth.types';
import { ROUTES } from '@/lib/config/routes';

export type BreadcrumbEntry = {
  section: string;
  title: string;
};

const extraEntries: (BreadcrumbEntry & { href: string })[] = [
  {
    href: ROUTES.console.newSubscription,
    section: 'Operations',
    title: 'New subscription',
  },
];

export function resolveTopbarBreadcrumb(pathname: string, role?: AuthRole | null): BreadcrumbEntry {
  if (pathname === overviewItem.href) {
    return { section: 'Workspace', title: overviewItem.label };
  }

  const extra = extraEntries.find(({ href }) => pathname === href);

  if (extra !== undefined) {
    return { section: extra.section, title: extra.title };
  }

  // Longest href wins: /console/settings/sessions matches both Settings and
  // Sessions, and the deeper page is the one the operator is actually on.
  let best: (BreadcrumbEntry & { href: string }) | undefined;

  for (const section of buildSidebarSections(role ?? undefined)) {
    for (const item of section.items) {
      if (!isActiveLink(pathname, item.href)) continue;
      if (best !== undefined && item.href.length <= best.href.length) continue;

      best = { href: item.href, section: section.label, title: item.label };
    }
  }

  if (best !== undefined) {
    return { section: best.section, title: best.title };
  }

  return { section: 'Console', title: humanizeLastSegment(pathname) };
}

/**
 * The nav destination the current path belongs to, if any.
 *
 * Kept separate from the visible breadcrumb so the component can tell "this is
 * the page itself" from "this is a record inside it" without changing the
 * entry shape every caller already compares.
 */
export function resolveTopbarDestinationHref(
  pathname: string,
  role?: AuthRole | null
): string | undefined {
  if (pathname === overviewItem.href) return overviewItem.href;

  const extra = extraEntries.find(({ href }) => pathname === href);

  if (extra !== undefined) return extra.href;

  let best: string | undefined;

  for (const section of buildSidebarSections(role ?? undefined)) {
    for (const item of section.items) {
      if (!isActiveLink(pathname, item.href)) continue;
      if (best !== undefined && item.href.length <= best.length) continue;

      best = item.href;
    }
  }

  return best;
}

export function TopbarBreadcrumb({ userRole }: TopbarBreadcrumbProps) {
  const pathname = usePathname();
  const { section, title } = resolveTopbarBreadcrumb(pathname, userRole);
  const href = resolveTopbarDestinationHref(pathname, userRole);
  // On the destination itself the page heading already says the name; the
  // breadcrumb repeating it ("OPERATIONS / Memberships" above "Memberships")
  // was the same word twice. Deeper pages keep it — a record page's heading is
  // its own id, so "OPERATIONS / Memberships" is the context that is missing.
  const onDestination = href === pathname;

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
      <span className="truncate text-[11px] font-medium tracking-[0.12em] text-(--sm-muted) uppercase">
        {section}
      </span>
      {onDestination ? null : (
        <>
          <span aria-hidden="true" className="text-(--sm-muted)">
            /
          </span>
          <span className="truncate text-sm font-semibold text-(--sm-fg)">{title}</span>
        </>
      )}
    </nav>
  );
}

function humanizeLastSegment(pathname: string): string {
  const last = pathname.split('/').findLast(Boolean) ?? 'Console';
  return last.replaceAll('-', ' ');
}

type TopbarBreadcrumbProps = {
  userRole?: AuthRole | null;
};
