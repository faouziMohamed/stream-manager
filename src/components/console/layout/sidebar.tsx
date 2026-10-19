'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Link2, Monitor, X } from 'lucide-react';
import { useState } from 'react';

import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { Button } from '@/components/ui/button';
import {
  buildSidebarSections,
  isActiveLink,
  isSectionActive,
  type NavItem,
  type NavSection,
  overviewItem,
} from '@/components/console/layout/sidebar-navigation';
import { useSidebar } from '@/components/console/layout/sidebar-context';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

const sectionToneClass: Record<NavSection['tone'], string> = {
  coral: 'text-(--sm-coral)',
  gold: 'text-(--sm-gold)',
  indigo: 'text-(--sm-indigo)',
  emerald: 'text-(--sm-emerald)',
  violet: 'text-(--sm-violet)',
};

/**
 * The role comes from the server, and only from the server.
 *
 * The client session is `undefined` until `/api/auth/session` answers, so an
 * admin-only group was absent from the first paint and appeared a moment
 * later — the nav visibly growing a row while the page loaded. The layout now
 * hands down the role it read from the database, which is also the authority
 * a role change updates; letting the JWT copy override it would resurrect the
 * stale role the whole flow is trying to leave behind.
 */
export function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const sections = buildSidebarSections(userRole);

  return (
    <>
      <aside className="hidden h-full w-72 shrink-0 overflow-y-auto border-r border-(--sm-border) bg-(--sm-sidebar-bg) p-4 text-(--sm-sidebar-fg) md:block">
        <SidebarContent pathname={pathname} sections={sections} onNavigate={close} />
      </aside>

      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-(--sm-overlay) md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 border-r border-(--sm-border) bg-(--sm-sidebar-bg) p-4 text-(--sm-sidebar-fg) transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-3 flex justify-end">
          <WithTooltip label="Close navigation">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              onClick={close}
            >
              <X className="size-4" />
            </Button>
          </WithTooltip>
        </div>

        <SidebarContent pathname={pathname} sections={sections} onNavigate={close} />
      </aside>
    </>
  );
}

type SidebarContentProps = {
  pathname: string;
  sections: NavSection[];
  onNavigate: () => void;
};

function SidebarContent({ pathname, sections, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center gap-2.5 px-3 py-1">
        <Monitor className="size-4 shrink-0 text-(--sm-coral)" />
        <h2 className="truncate text-sm font-semibold tracking-[0.01em] text-(--sm-sidebar-fg)">
          StreamManager
        </h2>
      </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        <NavLinkItem item={overviewItem} pathname={pathname} onClick={onNavigate} />

        {sections.map((section) => (
          <CollapsibleSection
            key={section.label}
            section={section}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-4 border-t border-(--sm-sidebar-border) pt-3">
        <Link
          href={ROUTES.home}
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm text-(--sm-sidebar-muted) transition-colors hover:border-(--sm-sidebar-border) hover:bg-(--sm-sidebar-hover) hover:text-(--sm-sidebar-fg)"
        >
          <Link2 className="size-4" />
          Public site
        </Link>
      </div>
    </div>
  );
}

function CollapsibleSection({
  section,
  pathname,
  onNavigate,
}: {
  section: NavSection;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isSectionActive(pathname, section);
  const [isExpanded, setIsExpanded] = useState(section.defaultOpen === true);
  const open = isExpanded || active;
  const SectionIcon = section.icon;
  const singleItem = section.items.length === 1 ? section.items[0] : undefined;

  if (singleItem !== undefined && singleItem.label === section.label) {
    return (
      <Link
        href={singleItem.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors',
          active
            ? 'border-(--sm-sidebar-border) bg-(--sm-sidebar-active) text-(--sm-sidebar-fg)'
            : 'border-transparent text-(--sm-sidebar-muted) hover:border-(--sm-sidebar-border) hover:bg-(--sm-sidebar-hover) hover:text-(--sm-sidebar-fg)'
        )}
      >
        <SectionIcon className={cn('size-4', sectionToneClass[section.tone])} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm leading-none font-medium">{section.label}</span>
          <span className="mt-1 block truncate text-[11px] text-(--sm-sidebar-helper)">
            {section.helper}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="ghost"
        aria-expanded={open}
        className={cn(
          'group flex h-auto w-full items-center justify-start gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
          active
            ? 'border-(--sm-sidebar-border) bg-(--sm-sidebar-active) text-(--sm-sidebar-fg)'
            : 'border-transparent text-(--sm-sidebar-muted) hover:border-(--sm-sidebar-border) hover:bg-(--sm-sidebar-hover) hover:text-(--sm-sidebar-fg)'
        )}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <SectionIcon className={cn('size-4', sectionToneClass[section.tone])} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm leading-none font-medium">{section.label}</span>
          <span
            className={cn(
              'mt-1 block truncate text-[11px] transition-colors group-hover:text-(--sm-sidebar-fg)',
              active ? 'text-(--sm-sidebar-fg)' : 'text-(--sm-sidebar-helper)'
            )}
          >
            {section.helper}
          </span>
        </span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </Button>

      {open ? (
        <div className="ml-4 space-y-1 border-l border-(--sm-sidebar-border) pl-3">
          {section.items.map((item) => (
            <NavLinkItem key={item.href} item={item} pathname={pathname} onClick={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NavLinkItem({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const active = isActiveLink(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex min-h-9 items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors',
        active
          ? 'border-(--sm-sidebar-border) bg-(--sm-sidebar-active) font-medium text-(--sm-sidebar-fg)'
          : 'border-transparent text-(--sm-sidebar-muted) hover:border-(--sm-sidebar-border) hover:bg-(--sm-sidebar-hover) hover:text-(--sm-sidebar-fg)'
      )}
    >
      <Icon className="size-4" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge === undefined ? null : (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold',
            item.badgeTone === 'danger'
              ? 'bg-(--sm-coral) text-(--sm-coral-fg)'
              : 'bg-(--sm-gold) text-(--sm-gold-fg)'
          )}
        >
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}
    </Link>
  );
}
