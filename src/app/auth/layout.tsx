import type { ReactNode } from 'react';
import Link from 'next/link';
import { Monitor } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-screen flex-col">
      {/* Top nav */}
      <header className="bg-background/80 flex h-14 shrink-0 items-center border-b px-4 backdrop-blur-sm sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Monitor className="text-primary h-5 w-5" />
          StreamManager
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Accueil
          </Link>
          <Link
            href="/contact"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </nav>
      </header>

      {/* Centered form */}
      <main className="flex flex-1 items-center justify-center p-4">{children}</main>

      {/* Footer */}
      <footer className="text-muted-foreground flex h-12 items-center justify-center border-t text-xs">
        © {new Date().getFullYear()} StreamManager — Espace administration
      </footer>
    </div>
  );
}
