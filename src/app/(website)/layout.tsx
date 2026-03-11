import Link from "next/link";
import { Monitor, ChevronRight } from "lucide-react";
import { WebsiteHeader } from "@/components/website/website-header";
import { ROUTES } from "@/lib/config/routes";

function WebsiteFooter() {
  return (
    <footer
      className="relative overflow-hidden border-t"
      style={{ background: "var(--sm-void)", borderColor: "var(--sm-border)" }}
    >
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-7">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-display font-extrabold text-lg"
              style={{ color: "var(--sm-fg)" }}
            >
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--sm-coral)" }}
              >
                <Monitor className="h-3.5 w-3.5 text-white" />
              </div>
              StreamManager
            </Link>
            <p
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: "var(--sm-muted)" }}
            >
              Vos abonnements streaming au meilleur prix — activés en moins de
              24h.
            </p>
          </div>

          {/* Nav */}
          <div className="space-y-3">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--sm-coral)" }}
            >
              Navigation
            </p>
            <nav className="flex flex-col gap-2">
              {[
                { label: "Catalogue", href: "/#catalogue" },
                { label: "Packs groupés", href: "/#packs" },
                { label: "Comment ça marche", href: "/#comment-ca-marche" },
                { label: "FAQ", href: "/#faq" },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="group inline-flex items-center gap-1.5 text-sm transition-colors hover:text-white"
                  style={{ color: "var(--sm-muted)" }}
                >
                  <ChevronRight
                    className="h-3 w-3"
                    style={{ color: "var(--sm-coral)" }}
                  />
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--sm-coral)" }}
            >
              Contact
            </p>
            <Link
              href={ROUTES.contact}
              className="sm-btn-coral inline-flex text-sm"
            >
              Commander un abonnement
            </Link>
          </div>
        </div>

        <div
          className="border-t pt-5 flex items-center justify-between gap-4 text-xs"
          style={{ borderColor: "var(--sm-border)", color: "var(--sm-muted)" }}
        >
          <p>
            &copy; {new Date().getFullYear()} StreamManager — Tous droits
            réservés
          </p>
          <span
            className="px-2.5 py-1 rounded-full border text-[10px] font-semibold"
            style={{
              background: "var(--sm-coral-s)",
              borderColor: "var(--sm-coral-b)",
              color: "var(--sm-coral)",
            }}
          >
            Activation &lt; 24h
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <WebsiteHeader />
      <main className="flex-1">{children}</main>
      <WebsiteFooter />
    </div>
  );
}
