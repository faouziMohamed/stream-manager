import Link from 'next/link';
import type { ReactNode } from 'react';

import { HelpCircle, ShieldCheck } from 'lucide-react';

import AuthBrandLogo from '@/app/(auth)/auth-brand-logo';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="light flex min-h-screen flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <header className="sticky top-0 z-30 border-b border-(--sm-border) bg-(--sm-surface)/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={ROUTES.home}
            className="inline-flex items-center gap-3 text-sm font-semibold text-(--sm-fg)"
          >
            <AuthBrandLogo />
            <span className="leading-none">StreamManager</span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Badge
              variant="outline"
              className="border-(--sm-emerald)/25 bg-(--sm-emerald-s) text-(--sm-fg)"
            >
              <ShieldCheck className="size-3" />
              Operator access
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'gap-2 text-(--sm-muted) hover:text-(--sm-fg)'
              )}
              href={ROUTES.auth.login}
            >
              <HelpCircle className="size-4" />
              <span className="hidden sm:inline">Need help?</span>
            </Link>
            <Link
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'border-0 bg-(--sm-coral) text-(--sm-coral-fg)'
              )}
              href={ROUTES.auth.login}
            >
              Request access
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[29rem]">{children}</div>
      </main>

      <footer className="border-t border-(--sm-border) bg-(--sm-surface)/80 px-4 py-4 text-center text-xs text-(--sm-muted)">
        Access is managed manually while public registration is disabled.
      </footer>
    </div>
  );
}
