import Link from "next/link";
import { Monitor } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Top nav */}
      <header className="h-14 border-b bg-background/80 backdrop-blur-sm flex items-center px-4 sm:px-6 shrink-0">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Monitor className="h-5 w-5 text-primary" />
          StreamManager
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
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
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="h-12 flex items-center justify-center text-xs text-muted-foreground border-t">
        © {new Date().getFullYear()} StreamManager — Espace administration
      </footer>
    </div>
  );
}
