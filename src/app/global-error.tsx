'use client';

import { useEffect } from 'react';

import { ErrorScreen } from '@/components/shared/error-screen';
import { Button } from '@/components/ui/button';
import { clientLogger } from '@/lib/logger/client-logger';

import './globals.css';

const log = clientLogger('global-error');

/**
 * The last line: the root layout itself failed, so this file renders its own
 * <html> and <body> and imports the stylesheet directly. Everything the
 * console normally provides — providers, tokens from the root layout, the
 * shell — is unavailable here, which is why the screen is the plain version.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    log.error('Root error', error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ErrorScreen
          code="500"
          title="The console could not start"
          description="Something failed before the interface loaded. Reloading usually clears it; if it keeps happening, the database or the deployment is the place to look."
          meta={error.digest === undefined ? undefined : `Digest ${error.digest}`}
          actions={
            <Button onClick={() => reset()} variant="accent">
              Try again
            </Button>
          }
        />
      </body>
    </html>
  );
}

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};
