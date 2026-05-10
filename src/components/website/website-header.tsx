'use client';

import Link from 'next/link';
import { Monitor, Moon, Sun, Laptop, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useMounted } from '@/lib/hooks/use-mounted';

const NAV = [
  { label: 'Catalogue', href: '/#catalogue' },
  { label: 'Packs', href: '/#packs' },
  { label: 'Comment ça marche', href: '/#comment-ca-marche' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Contact', href: '/contact' },
] as const;

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted)
    return (
      <div className="h-8 w-8 rounded-lg border" style={{ borderColor: 'var(--sm-border)' }} />
    );

  const cycle = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const isDark = resolvedTheme === 'dark';
  let Icon = Sun;
  if (theme === 'system') Icon = Laptop;
  else if (isDark) Icon = Moon;

  return (
    <button
      type="button"
      onClick={cycle}
      className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all"
      style={{
        background: 'oklch(1 0 0 / 0.04)',
        borderColor: 'var(--sm-border)',
        color: 'var(--sm-muted)',
      }}
      title="Changer le thème"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export function WebsiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        background: 'var(--sm-header-bg)',
        borderColor: 'var(--sm-border)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-display flex shrink-0 items-center gap-2.5 text-lg font-extrabold"
          style={{ color: 'var(--sm-fg)' }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--sm-coral)' }}
          >
            <Monitor className="h-4 w-4 text-white" />
          </div>
          Stream
          <span style={{ color: 'var(--sm-coral)' }}>Manager</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-1.5 text-sm transition-colors"
              style={{ color: 'var(--sm-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--sm-fg)';
                e.currentTarget.style.background = 'var(--sm-ghost-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--sm-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/console"
            className="hidden items-center rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all md:inline-flex"
            style={{
              border: '1px solid var(--sm-coral-b)',
              color: 'var(--sm-coral)',
              background: 'var(--sm-coral-s)',
            }}
          >
            Admin →
          </Link>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border md:hidden"
            style={{
              borderColor: 'var(--sm-border)',
              color: 'var(--sm-muted)',
            }}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="space-y-1 border-t px-4 py-4 md:hidden"
          style={{
            background: 'var(--sm-void)',
            borderColor: 'var(--sm-border)',
          }}
        >
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--sm-muted)' }}
            >
              {label}
            </Link>
          ))}
          <div className="border-t pt-2" style={{ borderColor: 'var(--sm-border)' }}>
            <Link
              href="/console"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold"
              style={{ color: 'var(--sm-coral)' }}
            >
              Espace admin →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
