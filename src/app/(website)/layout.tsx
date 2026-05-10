import type { ReactNode } from 'react';
import Link from 'next/link';
import { Monitor, ChevronRight } from 'lucide-react';
import { WebsiteHeader } from '@/components/website/website-header';
import { ROUTES } from '@/lib/config/routes';

function WebsiteFooter() {
  return (
    <footer
      className="relative overflow-hidden border-t"
      style={{ background: 'var(--sm-void)', borderColor: 'var(--sm-border)' }}
    >
      <div className="mx-auto max-w-5xl px-4 pt-10 pb-7">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <Link
              href="/"
              className="font-display inline-flex items-center gap-2 text-lg font-extrabold"
              style={{ color: 'var(--sm-fg)' }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: 'var(--sm-coral)' }}
              >
                <Monitor className="h-3.5 w-3.5 text-white" />
              </div>
              StreamManager
            </Link>
            <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'var(--sm-muted)' }}>
              Vos abonnements streaming au meilleur prix — activés en moins de 24h.
            </p>
          </div>

          {/* Nav */}
          <div className="space-y-3">
            <p
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: 'var(--sm-coral)' }}
            >
              Navigation
            </p>
            <nav className="flex flex-col gap-2">
              {[
                { label: 'Catalogue', href: '/#catalogue' },
                { label: 'Packs groupés', href: '/#packs' },
                { label: 'Comment ça marche', href: '/#comment-ca-marche' },
                { label: 'FAQ', href: '/#faq' },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="group inline-flex items-center gap-1.5 text-sm transition-colors hover:text-white"
                  style={{ color: 'var(--sm-muted)' }}
                >
                  <ChevronRight className="h-3 w-3" style={{ color: 'var(--sm-coral)' }} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: 'var(--sm-coral)' }}
            >
              Contact
            </p>
            <Link href={ROUTES.contact} className="sm-btn-coral inline-flex text-sm">
              Commander un abonnement
            </Link>
          </div>
        </div>

        <div
          className="flex items-center justify-between gap-4 border-t pt-5 text-xs"
          style={{ borderColor: 'var(--sm-border)', color: 'var(--sm-muted)' }}
        >
          <p>&copy; {new Date().getFullYear()} StreamManager — Tous droits réservés</p>
          <span
            className="rounded-full border px-2.5 py-1 text-[10px] font-semibold"
            style={{
              background: 'var(--sm-coral-s)',
              borderColor: 'var(--sm-coral-b)',
              color: 'var(--sm-coral)',
            }}
          >
            Activation &lt; 24h
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <WebsiteHeader />
      <main className="flex-1">{children}</main>
      <WebsiteFooter />
    </div>
  );
}
