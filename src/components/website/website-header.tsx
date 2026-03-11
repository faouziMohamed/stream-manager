"use client";

import Link from "next/link";
import { Monitor, Moon, Sun, Laptop, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useMounted } from "@/lib/hooks/use-mounted";

const NAV = [
  { label: "Catalogue", href: "/#catalogue" },
  { label: "Packs", href: "/#packs" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/contact" },
] as const;

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted)
    return (
      <div
        className="h-8 w-8 rounded-lg border"
        style={{ borderColor: "var(--sm-border)" }}
      />
    );

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const isDark = resolvedTheme === "dark";
  const Icon = theme === "system" ? Laptop : isDark ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={cycle}
      className="h-8 w-8 rounded-lg border flex items-center justify-center transition-all"
      style={{
        background: "oklch(1 0 0 / 0.04)",
        borderColor: "var(--sm-border)",
        color: "var(--sm-muted)",
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
        background: "var(--sm-header-bg)",
        borderColor: "var(--sm-border)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display font-extrabold text-lg shrink-0"
          style={{ color: "var(--sm-fg)" }}
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--sm-coral)" }}
          >
            <Monitor className="h-4 w-4 text-white" />
          </div>
          Stream
          <span style={{ color: "var(--sm-coral)" }}>Manager</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: "var(--sm-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--sm-fg)";
                e.currentTarget.style.background = "var(--sm-ghost-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--sm-muted)";
                e.currentTarget.style.background = "transparent";
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
            className="hidden md:inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={{
              border: "1px solid var(--sm-coral-b)",
              color: "var(--sm-coral)",
              background: "var(--sm-coral-s)",
            }}
          >
            Admin →
          </Link>
          <button
            type="button"
            className="md:hidden h-8 w-8 rounded-lg border flex items-center justify-center"
            style={{
              borderColor: "var(--sm-border)",
              color: "var(--sm-muted)",
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
          className="md:hidden border-t px-4 py-4 space-y-1"
          style={{
            background: "var(--sm-void)",
            borderColor: "var(--sm-border)",
          }}
        >
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{ color: "var(--sm-muted)" }}
            >
              {label}
            </Link>
          ))}
          <div
            className="pt-2 border-t"
            style={{ borderColor: "var(--sm-border)" }}
          >
            <Link
              href="/console"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold"
              style={{ color: "var(--sm-coral)" }}
            >
              Espace admin →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
