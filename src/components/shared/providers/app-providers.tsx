'use client';

import { Toaster } from 'sonner';
import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

import { QueryProvider } from '@/components/shared/providers/query-provider';
import { ThemeProvider } from '@/components/shared/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <SessionProvider>
          <QueryProvider>
            {children}
            <Toaster
              richColors
              closeButton
              position="top-right"
              toastOptions={{
                duration: 7000,
                classNames: {
                  toast: 'border-(--sm-border)',
                  description: '!opacity-90',
                },
              }}
            />
          </QueryProvider>
        </SessionProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

type AppProvidersProps = {
  children: ReactNode;
};
