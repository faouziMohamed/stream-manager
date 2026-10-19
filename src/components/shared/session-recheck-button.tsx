'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/auth-client';

/**
 * Re-reads the session after an access denial.
 *
 * A role change happens outside this tab, and the JWT keeps the role it was
 * issued with. Clicking this asks Auth.js to rebuild the token from the
 * current user row, then asks the Next router to re-render this route from the
 * server so every guard — the proxy and the GraphQL context — is evaluated
 * against the new role instead of the old one. `router.refresh()`, not a
 * browser reload: the framework already owns navigation.
 */
export function SessionRecheckButton() {
  const { update } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function recheck() {
    setPending(true);

    try {
      // The argument is what makes this an update: `update()` with nothing
      // only re-reads the existing cookie over GET and never reaches the jwt
      // callback, so the role would come back exactly as it was.
      await update({});
    } finally {
      router.refresh();
      setPending(false);
    }
  }

  return (
    <Button disabled={pending} onClick={() => void recheck()} variant="accent">
      <RefreshCw className={pending ? 'size-4 animate-spin' : 'size-4'} />
      {pending ? 'Checking…' : 'Check again'}
    </Button>
  );
}
