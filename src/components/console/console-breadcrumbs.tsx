'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  console: 'Console',
  services: 'Services',
  promotions: 'Promotions',
  clients: 'Clients',
  subscriptions: 'Abonnements',
  payments: 'Paiements',
  accounts: 'Comptes',
  timeline: 'Chronologie',
  analytics: 'Statistiques',
  inquiries: 'Messages',
  media: 'Médiathèque',
  summary: 'Résumé & Liens',
  settings: 'Paramètres',
  smtp: 'SMTP',
  cloudinary: 'Cloudinary',
  notifications: 'Notifications',
};

export function ConsoleBreadcrumbs() {
  const pathname = usePathname();
  if (pathname === '/console') return null;

  const segments = pathname.split('/').filter(Boolean);
  const contentSegments = segments.slice(1);

  if (contentSegments.length === 0) return null;

  const items = contentSegments.map((seg, i) => ({
    href: '/' + segments.slice(0, i + 2).join('/'),
    label: SEGMENT_LABELS[seg] ?? seg,
    isLast: i === contentSegments.length - 1,
  }));

  return (
    <nav aria-label="Fil d'Ariane" className="mb-5">
      <ol className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <li>
          <Link
            href="/console"
            className="hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">Console</span>
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.href} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="text-muted-foreground/30 h-3.5 w-3.5 shrink-0" />
            {item.isLast ? (
              <span className="text-foreground truncate font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground shrink-0 truncate transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
